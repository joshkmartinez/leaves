require("./server")();

const { Client, MessageEmbed } = require("discord.js");
const axios = require("axios");
const Statcord = require("statcord.js");
const config = require("./config");
const commands = require("./help");

let bot = new Client({
  fetchAllMembers: true, // Remove this bot is in large servers.
  presence: {
    status: "online",
    activity: {
      name: `for ${config.prefix}help`,
      type: "WATCHING",
    },
  },
});
const statcord = new Statcord.Client({
  key: config.statcord,
  client: bot,
});

bot.on("ready", async () => {
  console.log(`Logged in as ${bot.user.tag}.`);
  await statcord.autopost();
});
statcord.on("autopost-start", () => {
  console.log("Started statcord autopost.");
});

bot.on("message", async (message) => {
  if (message.content.startsWith(config.prefix)) {
    let args = message.content.slice(config.prefix.length).split(" ");
    let command = args.shift().toLowerCase();
    try {
      await statcord.postCommand(command, message.author.id);
    } catch (e) {
      console.log("Failed to post command stats to statcord");
    }
    switch (command) {
      case "ping":
      case "p":
        let m = await message.channel.send("Pong 🏓");
        return m.edit(
          `Pong 🏓\nBot latency is ${
            m.createdTimestamp - message.createdTimestamp
          }ms. Discord API Latency is ${bot.ws.ping}ms`
        );

      case "help":
      case "h":
        let embed = new MessageEmbed()
          .setTitle("Leaves Bot Commands")
          .setColor("#C0EFDB")
          .setFooter(
            `Requested by: ${
              message.member
                ? message.member.displayName
                : message.author.username
            }`,
            message.author.displayAvatarURL()
          )
          .setThumbnail(bot.user.displayAvatarURL());
        if (!args[0]) {
          embed.setDescription(
            Object.keys(commands)
              .map(
                (command) =>
                  `\`${command.padEnd(
                    Object.keys(commands).reduce(
                      (a, b) => (b.length > a.length ? b : a),
                      ""
                    ).length
                  )}\` - ${commands[command].description}`
              )
              .join("\n")
          );
          embed.addField(
            "What does Leaves do?",
            "Leaves is a bot that deletes all the messages of a user once they leave a server.\nIt requires manage message permissions in every channel that you would like it to operate it."
          );
          /*embed.addField(
            "Like Leaves?",
            "Please consider [upvoting Crewmate]() :smiley:\nOr you can [invite the bot to your own server!]()"
          );*/

          embed.addField(
            "Need help?",
            "[Join the Leaves Bot Support Server](https://discord.gg/nxsevKP)"
          );
        } else {
          if (
            Object.keys(commands).includes(args[0].toLowerCase()) ||
            Object.keys(commands)
              .map((c) => commands[c].aliases || [])
              .flat()
              .includes(args[0].toLowerCase())
          ) {
            let command = Object.keys(commands).includes(args[0].toLowerCase())
              ? args[0].toLowerCase()
              : Object.keys(commands).find(
                  (c) =>
                    commands[c].aliases &&
                    commands[c].aliases.includes(args[0].toLowerCase())
                );
            embed.setTitle(`COMMAND - ${command}`);

            if (commands[command].aliases)
              embed.addField(
                "Command aliases",
                `\`${commands[command].aliases.join("`, `")}\``
              );
            embed
              .addField("DESCRIPTION", commands[command].description)
              .addField(
                "FORMAT",
                `\`\`\`${config.prefix}${commands[command].format}\`\`\``
              );
          } else {
            embed
              .setColor("RED")
              .setDescription(
                "This command does not exist. Please use the help command without specifying any commands to list them all."
              );
          }
        }
        return message.channel.send(embed);
      case "test":
        return deleteCMD(message.member);
    }
  }
});

const deleteCMD = async (member) => {
  (await bot.guilds.fetch(member.guild.id)).channels.cache.map((c) => {
    try {
      c.messages.fetch({ limit: 100 }).then((messages) => {
        messages
          .filter((m) => m.author.id === member.id)
          .map((m) => m.delete());
      });
    } catch (e) {
      //no access to channel or incorrect perms
    }
  });
};

bot.on("guildMemberRemove", (member) => {
  return deleteCMD(member);
});

bot.login(config.token);
