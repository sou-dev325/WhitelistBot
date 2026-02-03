# WhitelistBot

ホワイトリスト自動化Bot。

申請チャンネルに投げられたメッセージを拾って、
Discord上のコンソールチャンネルにコマンドを流すだけのやつ。
成功ログが返ってきたら承認、ダメなら弾く。それだけ。

---

## できること

* 申請メッセージからMC IDを拾う
* 複数パターンの whitelist / fwhitelist コマンドを順番に試す
* 成功っぽいログを見つけたらOK判定
* 必要なら申請者にメンション通知

---

## セットアップ

```bash
npm init -y
npm install discord.js
```

`index.js` にコードを置いて、設定を埋める。

```js
const CONFIG = {
    TOKEN: 'BOT_TOKEN',
    REQUEST_CHANNEL_ID: '...',
    CONSOLE_CHANNEL_ID: '...',
    NOTIFICATION_CHANNEL_ID: '...',
};
```

起動

```bash
node index.js
```

---

## 申請メッセージ例

```
ユーザー名: Steve
メンション: 希望
```

* ID / ユーザー名 は必須
* メンション は「希望 / 要望 / 不要」のどれか

書き方がズレてたら弾かれる。

---

## 動き方（ざっくり）

1. 申請チャンネルのメッセージを監視
2. ID を抜き出す
3. 以下を順番に投げる

   * `fwhitelist add ID`
   * `fwhitelist add .ID`
   * `whitelist add .ID`
   * `whitelist add ID`
4. コンソールのログを5秒くらい眺める
5. 成功っぽい文言があれば承認

---

## 注意

* エラー処理は雑
* ログ判定も雑
* 公開運用向きではない

**「身内用だからこれでいい」前提のBot**。

---

あと、DiscordSRVのconsole機能使うからね。

## ライセンス

気にしない人向け。
自由に弄ってOK。
