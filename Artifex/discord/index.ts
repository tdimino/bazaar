// Require the necessary discord.js classes
import { Client, Events, GatewayIntentBits } from 'discord.js'
import dotenv from 'dotenv'
import { SoulGateway } from './soulGateway.js';
import { MentalProcess, useActions, usePerceptions, useSoulMemory } from "soul-engine";

dotenv.config()

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ] 
});

const gateway = new SoulGateway(client)


client.once(Events.ClientReady, readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  gateway.start()
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN_ARTIFEX);

process.on('SIGINT', async () => {
  console.warn("stopping")
  await gateway.stop()
  await client.destroy()
  process.exit(0)
})
