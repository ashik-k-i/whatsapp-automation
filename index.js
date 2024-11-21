const { DisconnectReason, makeWASocket, useMultiFileAuthState, MessageType, MessageOptions, Mimetype } = require('@whiskeysockets/baileys')
const fs = require('fs');

async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    const sock = makeWASocket({
        // can provide additional config here
        printQRInTerminal: true,
        auth: state
    })
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
            // reconnect if not logged out
            if(shouldReconnect) {
                connectToWhatsApp()
            }
        } else if(connection === 'open') {
            console.log('opened connection')
            sendMessage(sock);

        }
    })
    sock.ev.on ('creds.update', saveCreds)
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const message = m.messages[0];
            const isFromMe = message.key.fromMe; // Check if the message is sent by yourself
            const remoteJid = message.key.remoteJid; // Get the chat ID
    
            // Extract message content from possible properties
            const messageContent = message.message?.conversation ||
                message.message?.extendedTextMessage?.text ||
                message.message?.buttonsResponseMessage?.selectedButtonId ||
                message.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
                "";
    
            console.log('Received message:', messageContent, 'fromMe:', isFromMe, 'ID : ', remoteJid);
    
            // Check if the message is from yourself and matches "Hello"
            if (isFromMe && messageContent.toLowerCase() === '.bot') {
                console.log('Sending reply to myself:', remoteJid);
                await sock.sendMessage(remoteJid, { text: 'Bot Is Running!' }); // Send "Hii" in response to "Hello"
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });
    
     
}

async function sendMessage(sock) {
    try {
        const id = '918139050814@s.whatsapp.net'; // Replace with the recipient's WhatsApp ID
        const sentMsg  = await sock.sendMessage(id, { text: 'Bot Started !' })
        console.log('Start Msg sent successfully!');
    } catch (error) {
        console.error('Failed to send image:', error);
    }
}



// run in main file
connectToWhatsApp()
