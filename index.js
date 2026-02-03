const { Client, GatewayIntentBits } = require('discord.js');

const CONFIG = {
    TOKEN: '',
    REQUEST_CHANNEL_ID: '1459630513508581492',
    CONSOLE_CHANNEL_ID: '1467076911057604638',
    NOTIFICATION_CHANNEL_ID: '1459862335312105533',
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.once('ready', () => {
    console.log('bot起動');
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== CONFIG.REQUEST_CHANNEL_ID) return;

    const text = message.content;

    const idMatch = text.match(/(?:ユーザー名|ID)[:：]\s*([a-zA-Z0-9_.-]+)/i);
    const mentionMatch = text.match(/メンション[:：]?(希望|要望|不要)/i);

    if (!idMatch || !mentionMatch) {
        let miss = [];
        if (!idMatch) miss.push('ID');
        if (!mentionMatch) miss.push('メンション');
        await sendError(message, `足りない: ${miss.join(', ')}`);
        return;
    }

    const mcId = idMatch[1];
    const mention = /希望|要望/.test(mentionMatch[1]);

    let consoleChannel;
    try {
        consoleChannel = await client.channels.fetch(CONFIG.CONSOLE_CHANNEL_ID);
    } catch {
        return;
    }

    const cmds = [
        `fwhitelist add ${mcId}`,
        `fwhitelist add .${mcId}`,
        `whitelist add .${mcId}`,
        `whitelist add ${mcId}`,
    ];

    let ok = false;

    for (const cmd of cmds) {
        try {
            console.log('send:', cmd);
            await consoleChannel.send(cmd);

            const logs = await consoleChannel.awaitMessages({
                filter: m => m.channel.id === CONFIG.CONSOLE_CHANNEL_ID,
                max: 5,
                time: 5000,
            });

            const hit = logs.some(m => {
                const c = m.content.toLowerCase();
                return (
                    c.includes(mcId.toLowerCase()) &&
                    (
                        c.includes('ホワイトリスト') ||
                        (c.includes('added') && c.includes('whitelist'))
                    )
                );
            });

            if (hit) {
                ok = true;
                break;
            }
        } catch {
            // 何もしない
        }
    }

    if (ok) {
        await message.react('✅').catch(() => {});

        if (mention) {
            try {
                const notif = await client.channels.fetch(CONFIG.NOTIFICATION_CHANNEL_ID);
                await notif.send(
                    `<@${message.author.id}> 登録された\n` +
                    `\`${mcId}\` OK`
                );
            } catch {}
        }
    } else {
        await sendError(message, '通らなかった');
    }
});

async function sendError(message, reason) {
    try {
        const notif = await client.channels.fetch(CONFIG.NOTIFICATION_CHANNEL_ID);
        await notif.send(
            `<@${message.author.id}> ダメだった\n` +
            `理由: ${reason}\n` +
            message.url
        );
        await message.react('❌').catch(() => {});
    } catch {}
}

client.login(CONFIG.TOKEN);
