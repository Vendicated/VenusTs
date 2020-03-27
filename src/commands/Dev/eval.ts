import { Message } from 'discord.js';
import Command from '../../interfaces/Command';
import Util from '../../utils/Util';
import DB, { getGuild } from '../../database/mongo';
import VenClient from '../../interfaces/Client';
import { uploadHaste } from '../../utils/hastebin';

const callback = async (message: Message, args: string[]) => {
    const client = message.client as VenClient;
    const [db, getguild, util] = [DB, getGuild, Util];
    try {
        let output =
            (await eval(`( async () => {
            ${args.join(' ')}
          })()`)) ||
            (await eval(`( async () => {
            return ${args.join(' ')}
          })()`));

        if (typeof output !== 'string') output = require('util').inspect(output);
        if (output.length > 2000) return message.channel.send(await uploadHaste(output));

        message.channel.send(Util.clean(output), { code: 'xl' }).catch(err => {
            message.channel.send(Util.clean(err), { code: 'xl' });
        });
    } catch (err) {
        message.channel.send(Util.clean(err), { code: 'xl' });
    }
    return;
    [client, db, getguild, util];
};

export const command: Command = {
    name: 'eval',
    category: '',
    aliases: [],
    description: '',
    usage: '',
    developerOnly: true,
    guildOnly: false,
    dmOnly: false,
    requiresArgs: 1,
    userPermissions: '',
    botPermissions: '',
    modOnly: false,
    adminOnly: false,
    callback: callback
};