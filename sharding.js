require("./server")();

const Discord = require("discord.js");
const config = require("./config");
const Statcord = require("statcord.js");

const manager = new Discord.ShardingManager('./bot.js', { token: config.token});

const statcord = new Statcord.ShardingClient({
    key: config.statcord,
    manager
});

manager.spawn(3);

manager.on("shardCreate", (shard) => {
    console.log(`Shard ${shard.id} launched`);
});

statcord.on("autopost-start", () => {
    console.log("Started statcord autopost.");
});

statcord.on("post", status => {
    if (!status) console.log("Posted to statcord.");
    else console.error(status);
});