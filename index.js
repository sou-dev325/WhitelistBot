const { Client, GatewayIntentBits } = require('discord.js');

const CONFIG = {
    TOKEN: 'ここにTOKEN入れて',
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
    console.log('--- bot起動 ---');
});

// メイン
client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;
    if (msg.channel.id !== CONFIG.REQUEST_CHANNEL_ID) return;

    const txt = msg.content;

    // なんとなく解析
    const idMatch = txt.match(/(?:ユーザー名|ID)[:：]\s*([a-zA-Z0-9_.-]+)/i);
    const mentionMatch = txt.match(/メンション[:：]?(希望|要望|不要)/i);
    const isBedrock = /統合|bedrock/i.test(txt);

    if (!idMatch || !mentionMatch) {
        let miss = [];
        if (!idMatch) miss.push('ID');
        if (!mentionMatch) miss.push('メンション');
        return sendError(msg, `足りない: ${miss.join(', ')}`);
    }

    const mcId = idMatch[1];
    const wantMention = /希望|要望/.test(mentionMatch[1]);

    let consoleCh;
    try {
        consoleCh = await client.channels.fetch(CONFIG.CONSOLE_CHANNEL_ID);
    } catch {
        return;
    }

    // BedrockかJavaかで切り替え
    let cmds;
    if (isBedrock) {
        console.log('bedrockっぽい');
        cmds = [
            `fwhitelist add .${mcId}`,
            `whitelist add .${mcId}`,
        ];
    } else {
        console.log('javaっぽい');
        cmds = [
            `fwhitelist add ${mcId}`,
            `whitelist add ${mcId}`,
        ];
    }

    let ok = false;

    for (const cmd of cmds) {
        try {
            console.log('send ->', cmd);
            await consoleCh.send(cmd);

            const logs = await consoleCh.awaitMessages({
                filter: m => m.channel.id === CONFIG.CONSOLE_CHANNEL_ID,
                max: 5,
                time: 5000,
            });

            ok = logs.some(m => {
                const c = m.content.toLowerCase();
                return (
                    c.includes(mcId.toLowerCase()) &&
                    (c.includes('ホワイトリスト') || (c.includes('added') && c.includes('whitelist')))
                );
            });

            if (ok) break;
            console.log('ダメっぽい、次');

        } catch (e) {
            console.log('なんかエラー', e);
        }
    }

    if (ok) {
        await msg.react('✅').catch(() => {});

        if (wantMention) {
            try {
                const n = await client.channels.fetch(CONFIG.NOTIFICATION_CHANNEL_ID);
                await n.send(`<@${msg.author.id}> 登録できた\n\`${mcId}\``);
            } catch {}
        }
    } else {
        sendError(msg, '通らなかった');
    }
});

// 失敗用
async function sendError(msg, reason) {
    try {
        const n = await client.channels.fetch(CONFIG.NOTIFICATION_CHANNEL_ID);
        await n.send(
            `<@${msg.author.id}> 失敗\n` +
            `理由: ${reason}\n` +
            msg.url
        );
        await msg.react('❌').catch(() => {});
    } catch {}
}

client.login(CONFIG.TOKEN);
