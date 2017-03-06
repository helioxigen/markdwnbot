const token = process.env.TOKEN;

const Bot = require('node-telegram-bot-api');
const zalgo = require('to-zalgo');
let bot = '';

if(process.env.NODE_ENV === 'production') {
  bot = new Bot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
}
else {
  bot = new Bot(token, { polling: true });
}

console.log('Bot server started in the ' + process.env.NODE_ENV + ' mode');

function addSpecialChar(text, toadd){
  let res = '';
  let exceptions = ['*','_','`'];
  
  for (let i = 0; i < text.length; i++) {
    if (exceptions.some(e => e !== text[i])){
      res += text[i] + toadd;
    }
  }
  return res;
}

function generateArticles(names){
  let res = [];
  let keys = Object.keys(names);
  for (let i = 0; i < keys.length; i++) {
    res[i] = {
      type: 'article',
      id: `${i}`,
      title: keys[i],
      input_message_content: {
        message_text: names[keys[i]],
        parse_mode: 'Markdown'
      },
      description: names[keys[i]],
    };
  };
  return res;
}

function generateInline(text){
  let chars = ['-', '/'];
  let res = text;
  
  for (let i = 0; i < chars.length; i++) {
    let substr = text.match(`${chars[i]}(.*?)${chars[i]}`);
  
    while (substr != null) {
      let wordUnmod = substr[0];
      let wordMod = substr[1];
      let wordFormat = '';
      switch (chars[i]) {
        case '-':
          wordFormat = addSpecialChar(wordMod, '̶');
          break;
        case '/':
          wordFormat = zalgo(wordMod);
          break;
      }      
          
      res = res.replace(wordUnmod, wordFormat);
      substr = res.match(`${chars[i]}(.*?)${chars[i]}`);
    }
  }
  
  return res;
}

bot.on('inline_query', function (msg) {
  const queryId = msg.id;
  const text = msg.query;
  
  let mashedup = zalgo(text);
  let inline = generateInline(text);
  
  let answer = generateArticles({inline, mashedup});
  
  bot.answerInlineQuery(queryId, answer);
});

bot.on('message', function(msg) {
  const text = msg.text;
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, generateInline(text), {parse_mode: 'Markdown'})
});

module.exports = bot;
