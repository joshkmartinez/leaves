module.exports = {
  help: {
    aliases: ["h","commands", "cmds", "cmd"],
    description: "Shows the list of commands or help on a specified command.",
    format: "help [command-name]",
  },
  ping: {
    aliases: ["p", "pong"],
    description: "Measures the bot's latency with discord.",
    format: "ping",
  },
  purge: {
    aliases: ["delete"],
    description: "Purges ALL messages in the channel from the past 2 weeks. Requires administrator permissions.",
    format: "purge",
  }
};
