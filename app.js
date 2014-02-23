// Dependencies.

var request = require( 'request' ),
	config = require( './config.js' ),
	Q = require( 'q' ),
	log = require( './vendor/log.js' ),
	api = require( './vendor/api.js' ),
	pu = require( './vendor/printUtils.js' ),
	io = require( 'socket.io-client' ),
	readline = require( 'readline' );

// Exit handlers.

process.on( 'SIGINT', function ()
{
	process.exit( -1 );
} );

/*
process.on( 'exit', function ()
{
	socket.disconnect();
} );
*/

// Defers.

var defers = {
	name: Q.defer(), // Resolved when user has chosen his name.
	prematch: Q.defer(), // Resolved when user has chosen his team and has to wait for the other player.
	otherPlayerPrematchReady: Q.defer(), // Resolved when the other user has chosen his team.
	matchReady: Q.defer(), // Resolved when match is ready.
	startMatch: Q.defer() // Resolved when match has started.
};

// Functions.

var critical_error = function ( error, area )
{
	log.error( error, area );
	process.exit( -1 );
};

// Settings.

var baseURL = config.baseURL + ':' + config.port;

var me = {
	id: null,
	team: null,
	name: null,
};

var he = {
	id: null,
	team: null,
	name: null
};

// Socket.

var socket = io.connect( baseURL );

socket.on( 'messages', function ( data )
{
	log.info( data, 'MESSAGE' );
} );

socket.on( 'error', function ( data )
{
	log.error( data, 'ERROR' );
} );

socket.on( 'disconnect', function ( data )
{
	critical_error( data, 'DISCONNECT' );
} );

socket.on( 'other_player_has_chosen_team', function ()
{
	defers.otherPlayerPrematchReady.resolve();
} );

// Choose your name.
socket.on( 'your_id', function ( my_id )
{
	me.id = my_id;

	var rl = readline.createInterface(
	{
		input: process.stdin,
		output: process.stdout
	} );

	rl.question( "Write your name: ".yellow, function ( answer )
	{
		me.name = answer;
		rl.close();
		socket.emit( 'choose_name', me.name );
		socket.on( 'chosen_name_saved', function ()
		{
			defers.name.resolve();
		} );
	} );
} ); // on your_id.

// Choose your team.
defers.name.promise.then( function ()
{
	request( baseURL + '/team', function ( err, res )
	{
		if ( err ) critical_error( err );

		var teams = JSON.parse( res.body );

		api.loadTeams( teams ).then( function ()
		{

			log.input( 'Choose a team from the list:', 'TEAM' );
			console.log( '-----------------------------------' );
			pu.printTeamList( teams );
			console.log( '-----------------------------------' );

			var rl = readline.createInterface(
			{
				input: process.stdin,
				output: process.stdout
			} );

			rl.question( 'Team number: '.yellow, function ( answer )
			{
				me.team = teams[ answer ];
				rl.close();
				socket.emit( 'choose_team', me.team.id );
				socket.on( 'chosen_team_saved', function ()
				{
					defers.prematch.resolve();
				} );
			} );
		} ); // All characters ready.
	} ); // Teams request.
} ); // When name promise is resolved.

// Wait for the other player.
defers.prematch.promise.then( function ()
{
	log.info( 'Wait for the other player...', 'WAIT' );
	defers.otherPlayerPrematchReady.promise.then( matchReady.resolve );
} );

// Both players are ready.
socket.on( 'match_ready', function ( rival )
{
	log.info( 'Both players are ready!' );
	he.name = rival.name;
	api.getTeam( rival.team ).then( function ( rival_team )
	{
		he.team = rival_team;
		defers.startMatch.resolve();
	} );
} );

// Match starts.
defers.startMatch.promise.then( function ()
{

	pu.printBattleScenario(
	{
		me: me,
		he: he
	} );

} );