module.exports = {
  help: {
    aliases: ["h"],
    description: "Shows the list of commands or help on a specified command.",
    format: "help [command-name]",
  },
  ping: {
    aliases: ["p"],
    description: "Measures the bot's latency with discord.",
    format: "ping",
  },
  purge: {
    aliases: [],
    description: "Purges ALL messages in the channel from the past 2 weeks.",
    format: "purge",
  }
};
