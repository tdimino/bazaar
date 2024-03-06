import { Client, Events, Message } from "discord.js";
import { ActionEvent, Soul, SoulEvent } from "soul-engine/soul";


export class SoulGateway {
  private soul
  private client

  private lastMessage: any
  private processedMessageIds = new Set<string>(); // Added to track processed message IDs

  constructor(client: Client) {
    this.client = client
    this.soul = new Soul({
      organization: "tdimino",
      blueprint: "tamar",
      token: process.env.SOUL_ENGINE_API_KEY,
      soulId: process.env.SOUL_ID_TAMAR,
      debug: true,
      environment:{
        characterName: "Tamar de Minos",
        thingsTamarLoves: ["Olives", "Figs",],
      }
    })

    this.handleMessage = this.handleMessage.bind(this)
    this.onSoulEvent = this.onSoulEvent.bind(this)
    this.onChats = this.onChats.bind(this)
  }

  start() {
    this.soul.on("newSoulEvent", this.onSoulEvent)
    this.soul.on('says', this.onChats)
    this.soul.on('reacts', this.handleEmojiReaction.bind(this))
   
    this.soul.connect()

    this.client.on(Events.MessageCreate, this.handleMessage);
  }

  stop() {
    this.client.off(Events.MessageCreate, this.handleMessage);

    return this.soul.disconnect() // this handles listener cleanup
  }

  async handleEmojiReaction(evt: ActionEvent) {
    console.log("reacts!", evt)
    this.lastMessage.react(await evt.content())
  }

  async handleMessage(discordMessage: Message) {
    // Check if the message has already been processed
    if (this.processedMessageIds.has(discordMessage.id)) {
      return; // Skip processing this message
    }

    // Add the message ID to the set to mark it as processed
    this.processedMessageIds.add(discordMessage.id);

    // Implement a mechanism to limit the size of the set to prevent memory issues
    if (this.processedMessageIds.size > 1000) { // Example limit
      const oldestId = this.processedMessageIds.values().next().value;
      this.processedMessageIds.delete(oldestId);
    }

    // Ignore messages from yourself
    if (discordMessage.member?.displayName === "Tamar de Minos") return;

    // bot experimentation channel:
    if (discordMessage.channelId !== process.env.DISCORD_DEPLOYMENT_BAZAAR_CHANNEL) return;

    this.lastMessage = discordMessage

    this.soul.dispatch({
      action: "said",
      content: discordMessage.content,
      name: discordMessage.member?.displayName || discordMessage.author.username,
      _metadata: {
        discordMessage: {
          id: discordMessage.id,
          channelId: discordMessage.channelId,
          guildId: discordMessage.guildId,
          timestamp: new Date(discordMessage.createdTimestamp).toISOString(),
          authorId: discordMessage.author.id,
          username: discordMessage.author.username,
          avatar: discordMessage.author.avatarURL(),
          nickname: discordMessage.member?.displayName,
        }
      }
    })
  }

  

  onSoulEvent(evt: SoulEvent) {
    console.log("soul event!", evt)
  }

  async onChats(evt: ActionEvent) {
    console.log("chats!", evt)
    const { content } = evt

    const channel = await this.client.channels.fetch(process.env.DISCORD_DEPLOYMENT_BAZAAR_CHANNEL!)
    if (channel && channel.isTextBased()) {
      channel.send({
        content: await content(),
      })
    }

  }
}