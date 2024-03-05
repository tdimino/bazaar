import { Client, Events, Message } from "discord.js";
import { ActionEvent, Soul, SoulEvent } from "soul-engine/soul";

export class SoulGateway {
  private soul
  private client
  private processedMessageIds: Set<string>;
  private interactionRequestIds: Set<string>; // Cache for InteractionRequest IDs to ensure idempotency
  private messageTimestampThreshold: number; // Timestamp threshold for message processing

  private lastMessage: any

  constructor(client: Client) {
    this.client = client
    this.processedMessageIds = new Set();
    this.interactionRequestIds = new Set(); // Initialize the cache for InteractionRequest IDs
    this.messageTimestampThreshold = Date.now() - (1000 * 60 * 5); // Set threshold to 5 minutes ago
    this.soul = new Soul({
      organization: "tdimino",
      blueprint: "yosef",
      token: process.env.SOUL_ENGINE_API_KEY,
      soulId: process.env.SOUL_ID_YOSEF,
      debug: true,
      environment:{
        characterName: "Yosef",
        thingsYosefLoves: ["Olives", "Figs",],
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

    return this.soul.disconnect()
  }

  async handleEmojiReaction(evt: ActionEvent) {
    console.log("reacts!", evt)
    if (this.interactionRequestIds.has(evt.id)) return;
    this.interactionRequestIds.add(evt.id);

    this.lastMessage.react(await evt.content())
  }

  private shouldProcessMessage(discordMessage: Message): boolean {
    if (discordMessage.author.id === this.client.user?.id) return false;
    if (this.processedMessageIds.has(discordMessage.id)) return false;
    if (discordMessage.createdTimestamp < this.messageTimestampThreshold) return false;
    return true;
  }

  async handleMessage(discordMessage: Message) {
    if (!this.shouldProcessMessage(discordMessage)) {
      return;
    }

    this.processedMessageIds.add(discordMessage.id);

    if (this.processedMessageIds.size > 1000) {
      const oldestId = this.processedMessageIds.values().next().value;
      this.processedMessageIds.delete(oldestId);
    }

    if (discordMessage.channelId !== process.env.DISCORD_DEPLOYMENT_BAZAAR_CHANNEL) return;

    this.lastMessage = discordMessage;

    this.soul.dispatch({
      action: "said",
      content: discordMessage.content,
      name: discordMessage.member?.displayName || discordMessage.author.username,
      _metadata: {
        discordMessage: {
          id: discordMessage.id,
          channelId: discordMessage.channelId,
          guildId: discordMessage.guildId,
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
    if (this.interactionRequestIds.has(evt.id)) return;
    this.interactionRequestIds.add(evt.id);
  }

  async onChats(evt: ActionEvent) {
    console.log("chats!", evt)
    const { content } = evt

    if (this.interactionRequestIds.has(evt.id)) return;
    this.interactionRequestIds.add(evt.id);

    const channel = await this.client.channels.fetch(process.env.DISCORD_DEPLOYMENT_BAZAAR_CHANNEL!)
    if (channel && channel.isTextBased()) {
      channel.send({
        content: await content(),
      }).catch(console.error); // Error handling
    }
  }
}
