const { result, vqd } = require('../../dependancies/ddg');
const Enmap = require('enmap');
const enmap = new Enmap({ name: 'images', dataDir: './data/images', fetchAll: false, autoFetch: true });
const delay = function delay(time) {
	return new Promise((resolve) => setTimeout(resolve, time).unref());
};
const { MessageButton } = require('discord.js');
const en = new Enmap({ name: 'count', dataDir: './data/images', fetchAll: false, autoFetch: true });
const filterChoices = [
	{
		name: 'strict', value: 1,
	},
	{
		name: 'moderate', value: -1,
	},
	{
		name: 'off', value: -2,
	},
];

module.exports = {
	name: 'duckduckgo',
	description: 'Search something online with Duck Duck Go service',
	cooldown: 10,
	options: [
		{
			type:'SUB_COMMAND',
			name:'images',
			description: 'Search some images with Duck Duck Go service',
			options: [
				{
					type:'STRING',
					name: 'images',
					description: 'The image query to look for',
					required: true,
				},
				{
					type:'INTEGER',
					name: 'safesearch',
					description: 'Safe search filter',
					choices: filterChoices,
				},
			],
		},
	],
	/**
   * @param {import('discord.js').CommandInteraction} interaction
   */
	async run(interaction) {
		try {
			await interaction.defer();
			const userId = `${interaction.user.id}`;

			const next = new MessageButton({
				style: 'SECONDARY',
				customId: `${this.name}_next`,
				emoji: '⏭️',
			});

			const del = new MessageButton({
				style: 'SECONDARY',
				customId: `${this.name}_del`,
				emoji: '🗑️',
			});

			if (interaction.options.get('images')) {
				const enquiry = interaction.options.get('images')?.options.get('images').value;
				if (enquiry.match(/[!`~#$%^&*()\\|:;{}[\],><?]+/gm)) { return interaction.followUp('Forbidden character(s) found, please try again');}
				const safe = interaction.options.get('images').options.get('safeSearch')?.value ?? -1;
				const getToken = await vqd(enquiry, safe);
				const getImage = await result(enquiry, getToken[1]);
				en.set(userId, 5);
				/**
                * @type {Enmap<userId, getImage>}
                */
				enmap.set(userId, getImage);
				await delay(100);
				const array = enmap.get(userId);
				const files = [];
				for (let i = 0; i < 5; i++) {
					files.push(array[i].image);
				}
				return interaction.followUp({ content: `${files.join('\n')}`, components: [{ type: 'ACTION_ROW', components:[next, del] }] });
			}
		}
		catch (err) {console.error(err);}
	},
	/**
    * @param {import('discord.js').ButtonInteraction} interaction
    */
	async button(interaction) {
		try {
			await interaction.deferUpdate();
			const userId = `${interaction.user.id}`;

			const next = new MessageButton({
				style: 'SECONDARY',
				customId: `${this.name}_next`,
				emoji: '⏭️',
			});

			const prev = new MessageButton({
				style: 'SECONDARY',
				customId: `${this.name}_prev`,
				emoji: '⏮️',
			});

			const del = new MessageButton({
				style: 'SECONDARY',
				customId: `${this.name}_del`,
				emoji: '🗑️',
			});

			const array = enmap.get(userId);
			const files = [];
			if (interaction.customId == `${this.name}_next` && interaction.user.id === interaction.member.id) {
				en.math(userId, 'add', 5);
				const m = en.get(userId);
				if (m < 101) {
					for (let i = m - 5; i < m; i++) {
						files.push(array[i]?.image);
					}
					interaction.editReply({ content: `${files.join('\n')}`, components: [{ type: 'ACTION_ROW', components:[next, prev, del] }] });
				}

				else {
					interaction.editReply({ content: 'End of line', components: [{ type:'ACTION_ROW', components: [prev, del] }] });
				}
			}

			else if (interaction.customId == `${this.name}_prev` && interaction.user.id === interaction.member.id) {
				en.math(userId, 'subtract', 5);
				const m = en.get(userId);
				if (m <= 4) {
					interaction.editReply({ content: 'End of line', components: [{ type: 'ACTION_ROW', components:[next, del] }] });
				}

				else {
					for (let i = m - 5; i < m; i++) {
						files.push(array[i]?.image);
					}
					interaction.editReply({ content: `${files.join('\n')}`, components: [{ type:'ACTION_ROW', components: [next, prev, del] }] });
				}
			}

			else if (interaction.customId == `${this.name}_del` && interaction.user.id === interaction.member.id) {
				interaction.deleteReply();
			}
		}
		catch (error) {
			console.warn(error);
		}
	},
};