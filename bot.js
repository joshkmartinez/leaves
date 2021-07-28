const { Client, MessageEmbed } = require("discord.js");
const Statcord = require("statcord.js");
const blapi = require("blapi");
const config = require("./config");
const commands = require("./help");

let bot = new Client({
  presence: {
    status: "online",
    activity: {
      name: `for ${config.prefix}help`,
      type: "WATCHING",
    },
  },
});

bot.on("ready", () => {
  console.log(`Shard ${bot.shard.ids} ready (${bot.guilds.cache.size} guilds)`);

  const botListAPIKeys = {
    "top.gg": process.env.topgg_token,
    //'botlist.space': process.env.botlistspace_token,
    //'botsfordiscord.com': process.env.botsfordiscord_token,
    "discord.bots.gg": process.env.discordbotsgg_token,
    "discord.boats": process.env.discordboats_token,
    "discordbotlist.scom": process.env.discordbotlistcom_token,
  };

  //post stats every hour
  setInterval(() => {
    bot.shard
      .fetchClientValues("guilds.cache.size")
      .then((shards) => {
        const guildCount = shards.reduce((x, y) => x + y);
        const shardCount = shards.length;
        blapi.manualPost(
          guildCount,
          bot.user.id,
          botListAPIKeys,
          null,
          shardCount,
          null
        );
      })
      .catch((err) => {
        //stats will get posted from last shard
        if (err.name.includes("SHARDING_IN_PROCESS")) {
          return;
        }
        console.error(err);
      });
  }, 3600000);
});

bot.on("message", async (message) => {
  if (message.author.bot) return;
  if (message.content.toLowerCase().startsWith(config.prefix)) {
    let args = message.content.slice(config.prefix.length).split(" ");
    let command = args.shift().toLowerCase();

    Statcord.ShardingClient.postCommand(command, message.author.id, bot);

    switch (command) {
      case "ping":
      case "pong":
      case "p":
        let m = await message.channel.send("Pong 🏓");
        return m.edit(
          `Pong 🏓\nLeaves is currently online and operational.\nBot latency is ${
            m.createdTimestamp - message.createdTimestamp
          }ms. Discord API Latency is ${bot.ws.ping}ms`
        );

      case "help":
      case "h":
      case "commands":
      case "cmds":
      case "cmd":
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
            "Leaves deletes all a user's messages once they are kicked, banned, or leave your server.\n**To enable <@767559534167851008>, the bot must be granted `MANAGE_MESSAGE` permissions in every channel that you would like it to operate it.**"
          );
          embed.addField(
            "Like Leaves?",
            "Please consider [upvoting Leaves](https://top.gg/bot/767559534167851008/vote) :smiley:\nOr [inviting the bot to your own server!](https://top.gg/bot/767559534167851008/invite/)"
          );
          embed.addField(
            "Need help?",
            "[Join the Leaves Bot Support Server](https://discord.gg/4xCUX7ddgy)"
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
        if (message.channel.id !== "784195601206083584") {
          return message.reply(
            "You can only run this command in the <#784195601206083584> channel of the Leaves Bot Support server.\nhttps://discord.gg/4xCUX7ddgy"
          );
        }
        return deleteCMD(message.member);
      case "purge":
        //TODO: add confirmation

        const checkAdminPerms = (message) => {
          if (
            message.channel
              .permissionsFor(message.member)
              .has("ADMINISTRATOR")
          ) {
            return true;
          }
          return false;
        };

        if (
          message.channel.id === "784195601206083584" ||
          checkAdminPerms(message)
        ) {
          return purgeCMD(message);
        }
        return message.reply(
          "You need `ADMINISTRATOR` permissions in order to run this command."
        );
    }
  }
});

const deleteCMD = async (member) => {
  bot.guilds
    .fetch(member.guild.id)
    .then((guild) => {
      guild.channels.cache.map(async (c) => {
        if (c.type == "text") {
          await purgeCMD(null, c, member);
        }
      });
    })
    .catch((e) => {});
};

const purgeCMD = async (message, c = null, member = null) => {
  if (c) {
    message = c.lastMessage;
  }
  //empty channel
  if (!message) {
    return;
  }

  const channel = c ? c : message.channel;

  const dayDifference = (d1, d2) => {
    return Math.abs(
      parseInt((d2.getTime() - d1.getTime()) / (24 * 3600 * 1000))
    );
  };

  let fetched;
  let err = false;
  do {
    if (err) {
      break;
    }
    fetched = (await channel.messages.fetch({ limit: 100 })).filter(
      (message) => {
        if (dayDifference(new Date(), message.createdAt) < 14) {
          return message;
        }
      }
    );

    if (member) {
      fetched = fetched.filter((m) => {
        return m.author.id == member.id;
      });
    }

    channel
      .bulkDelete(fetched)
      .then(() => {
        Statcord.ShardingClient.postCommand("DELETE", message.author.id, bot);
      })
      .catch((e) => {
        err = true;
        if (!member) {
          message.reply(
            "Permissions error.\n<@767559534167851008> needs `MANAGE_MESSAGE` permissions in this channel to execute this command."
          );
        }
      });
  } while (fetched.size >= 2);
};

bot.on("guildMemberRemove", (member) => {
  return deleteCMD(member);
});

bot.on("guildBanAdd", (member) => {
  return deleteCMD(member);
});

bot.login(config.token);
