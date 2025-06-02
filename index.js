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
const MESSAGE_LINK_REGEX = /https:\/\/discord.com\/channels\/(@me|\d{19})\/(\d{18}|\d{19})\/(\d{19})/;
const THREAD_TITLE_REGEX = /(?<=\*\*)(.*?)(?=\*\*)/;
const MESSAGE_TRACKER_REGEX = /\*\*<==== Monolith Message Block Tracker ====>\*\*/;
const MESSAGE_TRACKER_TITLE = '**<==== Monolith Message Block Tracker ====>**';
const MIRROR_USER = process.env.USER1_MARVIN_EMAIL + ', ' + process.env.USER2_MARVIN_EMAIL;
let THREAD_CONFIRMATION_ID = '';
let ARCHIVED_THREAD = '';
const usersInfo = {
    [process.env.USER1_ID]: process.env.USER1_MARVIN_EMAIL,
    [process.env.USER2_ID]: process.env.USER2_MARVIN_EMAIL
};
const messageReviewer = {
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

// Format email function 
function getMailOptions(user, task) {
    const mailOptions = {
        from: process.env.NEXUS_EMAIL,
        to: user,
        subject: task
    };

    return mailOptions;
}

// Send task to Marvin function
function sendTask(mailOptions) {
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
            return true;
        }
        else  {
            console.log('Email sent: ' + info.response);
            return false;
        }
    });
}

function getDetailsForTaskCreation(interaction) {
    const task = interaction.options.get('task').value;
    const mirror = interaction.options.get('mirror').value; 
    const user = mirror ? MIRROR_USER : usersInfo[interaction.user.id]; 

    return {
        user: user, 
        task: task
    };
}

function getTargetChannel(chatId) {
    const channel = client.channels.cache.get(chatId);

    return channel;
}

function deconstructMessageLink(messageLink) {
    const identifiers = messageLink.split('/');
    const guildId = identifiers[4];
    const channelId = identifiers[5];
    const messageId = identifiers[6];

    return [guildId, channelId, messageId];
}

async function fetchMessageFromLink(guildId, channelId, messageId) {
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

    return reviewMessage;
}

function checkForMatchInMessage(messageContent, matchingPattern) {
    return messageContent.match(matchingPattern);
}

async function getMessageInfo(message) {
    const result = await message;
    const messageDate = result.createdAt.toLocaleString();
    const messageAuthorId = result.author.id

    return {
        messageDate: messageDate,
        messageAuthorId: messageAuthorId
    }
}

async function checkPinsForMessageTracker(pins, generalChat) {
    let messageTrackerExists = false; 

    for (const msg of pins.values()) {
        const messageTrackerMatch = checkForMatchInMessage(msg.content, MESSAGE_TRACKER_REGEX);
        console.log(`Herre's messageTrackerMatch: ${messageTrackerMatch}`);
        if (messageTrackerMatch && messageTrackerMatch[0]) {
            messageTrackerExists = true;
            const messageTrackerId = msg.id;
            console.log(`WE'RE IN`);
            const messageTracker = await generalChat.messages.fetch(messageTrackerId);
            console.log(`Here's messageTracker right after the await in the function: ${messageTracker}`);

            return {    
                messageTrackerExists: messageTrackerExists, 
                messageTracker: messageTracker
            };
        }
    };

    return {
        messageTrackerExists: messageTrackerExists, 
        messageTracker: null
    };
}

function getPositionToAddReview(tempMessageTrackerContentArray) {
    const index = tempMessageTrackerContentArray.findIndex(elem => elem === '');
    tempMessageTrackerContentArray[index] = review;
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
     
    // Register slash commands 
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

        const { user, task } = getDetailsForTaskCreation(interaction);

        // Format email
        const mailOptions = getMailOptions(user, task);

        // Send task to Marvin
        const errorOccured = sendTask(mailOptions);

        errorOccured ? interaction.reply('Error sending email') : interaction.reply('Email sent');
    }

    // Review slash command
    if (interaction.commandName === 'review') {
        const messageLink = interaction.options.get('link').value;
        const generalChat = getTargetChannel(process.env.GENERAL_CHAT_ID);
        
        if (MESSAGE_LINK_REGEX.test(messageLink)) {

            // Deconstruct message link
            const [guildId, channelId, messageId] = deconstructMessageLink(messageLink);

            try {
                // Fetch message associated with message link
                const reviewMessage = fetchMessageFromLink(guildId, channelId, messageId);

                // Get date and author of message to be reviewed
                const { messageDate: reviewMessageDate, messageAuthorId: reviewMessageAuthorId } = await getMessageInfo(reviewMessage);

                const reviewerId = messageReviewer[reviewMessageAuthorId];

                // Check if message tracker is already in pins
                const pins = await generalChat.messages.fetchPinned()
                const { messageTrackerExists, messageTracker } = await checkPinsForMessageTracker(pins, generalChat);
                console.log(`Here's messageTracker after the function: ${messageTracker}`);

                // Create reviewer mention
                const reviewer = `<@${reviewerId}>`;

                // Format reviewer mention
                const reviewerMention = `**For ${reviewer}:**`;

                // Format review to be added
                const review = `- ${reviewMessageDate}: ${messageLink}`;

                // Messge tracker doesn't exist
                if (!messageTrackerExists) {
                    generalChat.send(`${MESSAGE_TRACKER_TITLE} \n${reviewerMention} \n${review}`).then((msg) => msg.pin());
                    interaction.reply('Review added!');
                    return;
                }

                // Grab current message tracker reviews 
                const tempMessageTrackerContent = messageTracker.content;

                // Check if reviewer already has reviews in message tracker
                const userIsAlreadyReviewer = checkForMatchInMessage(tempMessageTrackerContent, reviewerId);

                // New reviewer added to message tracker 
                if (!userIsAlreadyReviewer) {
                    messageTracker.edit(tempMessageTrackerContent + `\n\n${reviewerMention} \n${review}`);
                    interaction.reply('Review added!');
                    return;
                }

                // Split current message tracker reviews by line
                const tempMessageTrackerContentArray = tempMessageTrackerContent.split(/\r\n|\r|\n/);

                // Reviewer is second block
                if (tempMessageTrackerContentArray[1] !== reviewer) {
                    messageTracker.edit(tempMessageTrackerContent + `\n${review}`);
                    interaction.reply('Review added!');
                    return;
                }
        
                // Reviewer is first block
                getPositionToAddReview(tempMessageTrackerContentArray);
                messageTracker.edit(tempMessageTrackerContentArray.join());
                interaction.reply('Review added!');
            } 
            catch (error) {
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

    try {
        // Grab message thread was created from 
        const threadMessage = await thread.fetchStarterMessage();

        // Automate thread title by grabbing from starter message 
        const threadTitleMatch = checkForMatchInMessage(threadMessage.content, THREAD_TITLE_REGEX);
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
        const parentChannel = getTargetChannel(newThread.parentId);
        parentChannel.send(`Are you sure you want to archive ${newThread.name}? Confirm you've finished all discussions`);

        // Grab message id of confirmation message 
        setTimeout(function() {
            THREAD_CONFIRMATION_ID = parentChannel.lastMessageId;
        }, 1000) // TEST TIME HERE

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

            // Format email
            const mailOptions = getMailOptions(MIRROR_USER, processingTask);  

            // Send thread processing task to Marvin
            const errorOccured = sendTask(mailOptions);

            errorOccured ? parentChannel.send('Error sending email') : parentChannel.send('Email sent');
        }
        else if (emoji === '👎') {
            parentChannel.send(`You've elected to reopen the thread`);
            ARCHIVED_THREAD.setArchived(false);
        }
    }
});

// Log into Discord
client.login(process.env.DISCORD_TOKEN);
