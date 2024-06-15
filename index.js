import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import { load } from 'cheerio';
import connectDB from './db.js';
import { model, Schema } from 'mongoose';
import { schedule } from 'node-cron';

// Set up MongoDB connection and BlogLink model
connectDB();
const blogLinkSchema = new Schema({
  text: String,
  url: String
}, { timestamps: true });
const BlogLink = model('BlogLink', blogLinkSchema);

const token = process.env.TELEGRAM_BOT_TOKEN;  // Use your actual token
const bot = new TelegramBot(token, { polling: true });

let subscribers = new Set();  // Store subscriber chat IDs

// Telegram bot listeners
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (messageText === '/start') {
    bot.sendMessage(chatId, 'Welcome to the Codeforces Blog Tracker Bot!');
    subscribers.add(chatId);  // Subscribe user to updates
    bot.sendMessage(chatId, 'You have been subscribed to new blog updates.');
    axios.get("https://codeforces.com/").then(response => {
        const $ = load(response.data);
        const recentActions = $('.recent-actions');
    
        recentActions.find('li').each((index, element) => {
          const blogLinkElement = $(element).find('a[href^="/blog/entry/"]').first();
          if (blogLinkElement.length) {
            const linkText = blogLinkElement.text().trim();
            const linkHref = `https://codeforces.com${blogLinkElement.attr('href')}`;
                const newBlogLink = new BlogLink({ text: linkText, url: linkHref });
                  subscribers.forEach(chatId => {
                    bot.sendMessage(chatId, `New blog posted: ${linkText}\nURL: ${linkHref}`);
                  });
          }
        });
      }).catch(error => {
        console.log("Error fetching data:", error);
      });
  } else if (messageText === '/stop') {
    subscribers.delete(chatId);  // Unsubscribe user from updates
    bot.sendMessage(chatId, 'You have been unsubscribed from new blog updates.');
  }
});

// Function to fetch and notify about new blogs
function fetchData() {
    console.log(subscribers);
    console.log("bruh");
  axios.get("https://codeforces.com/").then(response => {
    const $ = load(response.data);
    const recentActions = $('.recent-actions');
    const currentLinks = new Set();

    recentActions.find('li').each((index, element) => {
      const blogLinkElement = $(element).find('a[href^="/blog/entry/"]').first();
      if (blogLinkElement.length) {
        const linkText = blogLinkElement.text().trim();
        const linkHref = `https://codeforces.com${blogLinkElement.attr('href')}`;
        currentLinks.add(linkHref);

        if (!subscribers.size) return;  // Exit if no subscribers

        // Notify subscribers if new link is found
        BlogLink.findOne({ url: linkHref }).then(existingLink => {
          if (!existingLink) {
            const newBlogLink = new BlogLink({ text: linkText, url: linkHref });
            newBlogLink.save().then(() => {
              subscribers.forEach(chatId => {
                bot.sendMessage(chatId, `New blog posted: ${linkText}\nURL: ${linkHref}`);
              });
            }).catch(err => console.error('Error saving data:', err));
          }
        });
      }
    });
  }).catch(error => {
    console.log("Error fetching data:", error);
  });
}
// Start the cron job to fetch data every 30 minutes
schedule('0 */30 * * * *', fetchData, {
    scheduled: true,
    timezone: "UTC"
  });
  