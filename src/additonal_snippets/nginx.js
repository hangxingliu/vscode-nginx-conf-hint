module.exports = {
	"Block location": {
		prefix: "location",
		body: "location ${1:/} {\n\t${0}\n}",
	},
	"Block upstream": {
		prefix: "upstream",
		body: "upstream ${1} {\n\t${0}\n}",
	},
	"Block server with directives": {
		prefix: "server",
		body: [
			"server {",
			"\tlisten ${1:80};",
			"\tserver_name ${2};",
			"\taccess_log  ${3:logs/server.access.log} main;",
			"\t${0}",
			"}",
		],
	},
};
