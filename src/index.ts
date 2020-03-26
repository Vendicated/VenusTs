import fs from 'fs';
import { Message } from 'discord.js';
import config from './utils/config';
import Client from './interfaces/Client';
import Command from './interfaces/Command';
import db from './database/mongo';

const VenClient = new Client({
    disableMentions: 'everyone',
    presence: {
        activity: {
            name: `${config.defaultPrefix}help`,
            type: 'LISTENING'
        }
    }
});

fs.readdirSync(__dirname + '/commands/').forEach(folder => {
    const commandFiles = fs.readdirSync(__dirname + `/commands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command: Command = require(__dirname + `/commands/${folder}/${file}`).command;
        if (!command.name) throw new Error('ERROR! INVALID COMMAND BODY: ' + file);
        VenClient.commands.set(command.name, command);
    }
});

VenClient.once('ready', () => {
    console.info('Logged in!');
});

VenClient.on('message', async (message: Message) => {
    if (message.author.bot) return;

    const guildSettings: any = message.guild ? VenClient.guildSettings.get(message.guild.id) || (await db.findOne({ guildId: message.guild.id })) : null;
    if (guildSettings && !VenClient.guildSettings.has(message.guild!.id)) {
        VenClient.guildSettings.set(message.guild!.id, guildSettings);
    }
    const guildPrefix = guildSettings?.settings.prefix;
    const prefixRegex = new RegExp(`^(<@!?${VenClient.user!.id}>|${(guildPrefix || config.defaultPrefix).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s*`);
    if (!prefixRegex.test(message.content)) return;

    const matched = message.content.match(prefixRegex);
    const prefix = matched ? matched[0] : null;
    if (!prefix || !message.content.startsWith(prefix)) return;

    const args = message.content
        .slice(prefix.length)
        .trim()
        .split(' ');
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const command = VenClient.commands.get(commandName);
    if (!command || !command.callback) return;

    command.callback(message, args, VenClient);
});

VenClient.login(config.token);
