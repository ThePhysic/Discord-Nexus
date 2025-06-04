import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

import { Client, Events, SlashCommandBuilder, GatewayIntentBits, Partials} from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [
        Partials.Channel,
        Partials.Message
    ]
});

// Global  variables
const LINK_REGEX = /https:\/\/discord.com\/channels\/(@me|\d{19})\/(\d{18}|\d{19})\/(\d{19})/;
const THREAD_TITLE_REGEX = /(?<=\*\*)(.*?)(?=\*\*)/;
const MESSAGE_TRACKER_REGEX = /\*\*<==== Monolith Message Block Tracker ====>\*\*/;
let THREAD_CONFIRMATION_ID = '';
let ARCHIVED_THREAD = '';
const MIRROR_USER = process.env.USER1_MARVIN_EMAIL + ', ' + process.env.USER2_MARVIN_EMAIL;
const usersInfo = {
    [process.env.USER1_ID]: process.env.USER1_MARVIN_EMAIL,
    [process.env.USER2_ID]: process.env.USER2_MARVIN_EMAIL
};
const messageReviewIntendedUser = {
    [process.env.USER1_ID]: process.env.USER2_ID,
    [process.env.USER2_ID]: process.env.USER1_ID
};

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NEXUS_EMAIL,
        pass: process.env.NEXUS_PASSWORD
    }
});

// Task creation function 
function getMailOptions(user, task) {
    const mailOptions = {
        from: process.env.NEXUS_EMAIL,
        to: user,
        subject: task
    };

    return mailOptions;
}

// Confirm bot is logged in
client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    // Create ping slash command
    const ping = new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!')
    
    // Create inversion slash command
    const invert = new SlashCommandBuilder()
        .setName('inversion')
        .setDescription('Inverts the message you send')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to be inverted')
                .setRequired(true));

    // Create task creation slash command
    const addTask = new SlashCommandBuilder()
        .setName('addtask')
        .setDescription('Adds task to Marvin')
        .addStringOption(option =>
            option.setName('task')
                .setDescription('The task to be added')
                .setRequired(true))
        .addBooleanOption(option => 
            option.setName('mirror')
                .setDescription('If task should show up for both users')
                .setRequired(true))

    // Create review slash command
    const review = new SlashCommandBuilder()
        .setName('review')
        .setDescription('Adds message to message block tracker')
        .addStringOption(option =>
            option.setName('link')
                .setDescription('The link to the message to be reviewed')
                .setRequired(true));
     
    
    client.application.commands.create(ping);
    client.application.commands.create(invert);
    client.application.commands.create(addTask);
    client.application.commands.create(review);

});

// Listen for slash commands
client.on(Events.InteractionCreate, async (interaction) => {

    // Ping slash command
    if (interaction.commandName === 'ping') {
        interaction.reply('Pong!');
    }

    // Inversion slash command
    if (interaction.commandName === 'inversion') {
        const message = interaction.options.get('message').value;
        
        // Reverse string
        let invertedMessage = message.split('').reverse().join('');

        interaction.reply(invertedMessage);
    }

    // Task creation slash command
    if (interaction.commandName === 'addtask') {

        const task = interaction.options.get('task').value;
        const mirror = interaction.options.get('mirror').value; 
        const user = mirror ? MIRROR_USER : usersInfo[interaction.user.id]; 

        // Create task
        const mailOptions = getMailOptions(user, task);

        // Send task to Marvin
        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.log(error);
                interaction.reply('Error sending email');
            }
            else  { 
                console.log('Email sent: ' + info.response);
                interaction.reply('Email sent');
            }
        });
    }

    // Review slash command
    if (interaction.commandName === 'review') {
        const messageLink = interaction.options.get('link').value;
        const generalChat = client.channels.cache.get(process.env.GENERAL_CHAT_ID);
        
        if (LINK_REGEX.test(messageLink)) {

            // Deconstruct message link
            const identifiers = messageLink.split('/');
            const guildId = identifiers[4];
            const channelId = identifiers[5];
            const messageId = identifiers[6];

            // Fetch message associated with message link
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) {
                    interaction.reply('Guild not found');
                }

                const channel = guild.channels.cache.get(channelId);
                if (!channel) {
                    interaction.reply('Channel not found');
                }

                const reviewMessage = await channel.messages.fetch(messageId);
                if (!reviewMessage) {
                    interaction.reply('Message not found');
                }

                // Get date and author of message to be reviewed
                const reviewMessageDate = reviewMessage.createdAt.toLocaleString();
                const reviewMessageAuthorId = reviewMessage.author.id;

                const messageReviewerId = messageReviewIntendedUser[reviewMessageAuthorId];

                // Check if message tracker is already in pins
                const pins = await generalChat.messages.fetchPinned()
                let messageTrackerExists = false;
                let messageTrackerId = ''; 
                pins.forEach(msg => {
                    const messageTrackerMatch = msg.content.match(MESSAGE_TRACKER_REGEX);
                    if (messageTrackerMatch && messageTrackerMatch[0]) {
                        messageTrackerExists = true;
                        messageTrackerId = msg.id;
                    }
                });

                // Messge tracker doesn't exist
                if (!messageTrackerExists) {
                    // CHANGE so it pings user
                    generalChat.send(`**<==== Monolith Message Block Tracker ====>** \n**For <@${messageReviewerId}:** \n- ${reviewMessageDate}: ${messageLink}`).then((msg) => msg.pin());
                    interaction.reply('Review added!');
                    return;
                }

                const messageTracker = await generalChat.messages.fetch(messageTrackerId)
                const tempMessageTrackerContent = messageTracker.content;
                const userAsReviewerMatch = tempMessageTrackerContent.match(messageReviewerId);

                // New reviewer added to block
                if (!userAsReviewerMatch) {
                    // CHANGE so it pings user
                    messageTracker.edit(tempMessageTrackerContent + `\n\n**For <@${messageReviewerId}:** \n- ${reviewMessageDate}: ${messageLink}`);
                    interaction.reply('Review added!');
                    return;
                }

                const tempMessageTrackerContentArray = tempMessageTrackerContent.split(/\r\n|\r|\n/);

                // Reviewer is second block
                // CHANGE so it pings user
                if (tempMessageTrackerContentArray[1] !== `<@${messageReviewerId}`) {
                    messageTracker.edit(tempMessageTrackerContent + `\n- ${reviewMessageDate}: ${messageLink}`);
                    interaction.reply('Review added!');
                    return;
                }
        
                // Reviewer is first block
                const index = tempMessageTrackerContentArray.findIndex(elem => elem === '');
                tempMessageTrackerContentArray[index] = `- ${reviewMessageDate}: ${messageLink}`;
                messageTracker.edit(tempMessageTrackerContentArray.join());
                interaction.reply('Review added!');

            } catch (error) {
                console.error('Error fetching message:', error)
                interaction.reply('Failed to fetch message');
            }
        }
        else {
            interaction.reply('Invalid link. Please try again.');
        }
    }
})

// Listen for threads being created
client.on(Events.ThreadCreate, async (thread) => {
    console.log(`Thread created: ${thread.name} in ${thread.parent.name}`);
     
    try {
        // Grab message thread was created from 
        const threadMessage = await thread.fetchStarterMessage();
        console.log(`Thread created from message: ${threadMessage.content}`);

        // Automate thread title by grabbing from starter message 
        const threadTitleMatch = threadMessage.content.match(THREAD_TITLE_REGEX);
        if (threadTitleMatch && threadTitleMatch[0]) {
            thread.setName(threadTitleMatch[0]);
        }
    } 
    catch (error) {
        console.error('Error fetching starter message:', error);
    }
});

// Listen for threads being archived
client.on(Events.ThreadUpdate, (oldThread, newThread) => {
    if (!oldThread.archived && newThread.archived) {
        console.log(`Thread ${newThread.name} has been archived`);

        // Bot sends confirmation message for archiving thread
        const parentChannel = client.channels.cache.get(newThread.parentId);
        parentChannel.send(`Are you sure you want to archive ${newThread.name}? Confirm you've processed everything`);
        setTimeout(function() {
            console.log(parentChannel.lastMessageId);
            THREAD_CONFIRMATION_ID = parentChannel.lastMessageId;
        }, 1000)
        ARCHIVED_THREAD = newThread;
    }
});

// Listen for reactions to messages
client.on(Events.MessageReactionAdd, async (reaction) => {
    // Check if message reacted to is from bot
    if (reaction.message.author.id === client.user.id && reaction.message.id === THREAD_CONFIRMATION_ID) {
        // Get the emoji
        const emoji = reaction.emoji.name;
        const parentChannel = reaction.message.channel;

        // Check the reaction emoji for thread archival confirmation
        if (emoji === '👍') {
            parentChannel.send(`You've confirmed the archival of the thread`);

            const processingTask = `Process ${ARCHIVED_THREAD.name} in Monolith: ${ARCHIVED_THREAD.url} +today ~15m @Processing`;

            // Create processing task
            const mailOptions = getMailOptions(process.env.USER2_MARVIN_EMAIL, processingTask); // CHANGE

            // Send thread processing task to Marvin
            transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                    console.log(error);
                    parentChannel.send('Error sending email');
                }
                else  {
                    console.log('Email sent: ' + info.response);
                    parentChannel.send('Email sent');
                }
            });

        }
        else if (emoji === '👎') {
            parentChannel.send(`You've elected to reopen the thread`);
            ARCHIVED_THREAD.setArchived(false);
        }
    }
});

// Log into Discord
client.login(process.env.DISCORD_TOKEN);
