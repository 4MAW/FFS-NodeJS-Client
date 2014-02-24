// Dependencies.

var request = require( 'request' ),
	config = require( './config.js' ),
	Q = require( 'q' ),
	log = require( './vendor/log.js' ),
	api = require( './vendor/api.js' ),
	pu = require( './vendor/printUtils.js' ),
	Constants = require( './vendor/constants.js' ),
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
	name: null
};

var he = {
	id: null,
	team: null,
	name: null
};

var currently_in_decision_phase = false;

// Socket.

var socket = io.connect( baseURL );

socket.on( 'disconnect', function ( data )
{
	critical_error( data, 'DISCONNECT' );
} );

var login = function ()
{
	var defer_username = Q.defer();
	var defer_password = Q.defer();

	var username = null;
	var password = null;

	log.input( 'You have to login to play', 'LOGIN' );

	var rl = readline.createInterface(
	{
		input: process.stdin,
		output: process.stdout
	} );

	rl.question( "Write your username: ".yellow, function ( answer )
	{
		username = answer;
		me.name = username;
		rl.close();
		defer_username.resolve();
	} );

	defer_username.promise.then( function ()
	{
		var rl = readline.createInterface(
		{
			input: process.stdin,
			output: process.stdout
		} );

		rl.question( "Write your password: ".yellow, function ( answer )
		{
			password = answer;
			rl.close();
			defer_password.resolve();
		} );
	} );

	defer_password.promise.then( function ()
	{
		socket.emit( Constants.LOGIN_EVENT,
		{
			username: username,
			password: password
		} );
	} );
};

var choose_team = function ()
{
	// @TODO Query teams for current user.
	// @TODO Request the list of teams only once.
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
				socket.emit( Constants.CHOOSE_TEAM_EVENT, me.team.id );
			} );
		} ); // All characters ready.
	} ); // Teams request.
};

socket.on( Constants.WELCOME_EVENT, function ()
{
	// I'm connected to server so I have to login.
	login();
} );

socket.on( Constants.LOGIN_FAILED_EVENT, function ()
{
	// I my login failed, login again.
	login();
} );

socket.on( Constants.LOGIN_SUCCEED_EVENT, function ()
{
	choose_team();
} );

socket.on( Constants.INVALID_TEAM_EVENT, function ()
{
	choose_team();
} );

socket.on( Constants.VALID_TEAM_EVENT, function ()
{
	log.info( 'Server is looking for a proper rival...', 'WAIT' );
} );

socket.on( Constants.MATCH_FOUND_EVENT, function ()
{
	log.info( 'A rival has been found!', 'WAIT' );
} );

socket.on( Constants.SEND_RIVAL_INFO_EVENT, function ( environment )
{
	var rival = environment.rival;
	he.name = rival.name;
	he.team = rival.team;
	me.team = environment.team;

	var assign_class = function ( _c )
	{
		return function ( _class )
		{
			me.team.characters[ _c ].class = _class;
		};
	};

	var promises = [];
	for ( var _c in me.team.characters )
	{
		var defer = Q.defer();
		defer.promise.then( assign_class( _c ) );
		promises.push( defer.promise );
		api.loadClass( me.team.characters[ _c ].class ).then( defer.resolve );
	}

	Q.all( promises ).then( function ()
	{
		decision_phase();
	} );
} );

var decision_phase = function ()
{
	currently_in_decision_phase = true;

	pu.printBattleScenario(
	{
		me: me,
		he: he
	} );

	var selections = [];

	var process_selection = function ( _c, defer )
	{
		return function ( answer ) {

		};
	};

	var selection_promises = [];

	var questions_to_ask = [];

	var ask_selection_question = function ( _c, def )
	{
		return function ()
		{
			var c = me.team.characters[ _c ];
			if ( c.alive )
			{
				log.info( 'What should ' + c.name + ' do?', 'CHARACTER' );

				log.input( 'Choose a skill from the list:', 'SKILL' );
				pu.printSkills( c );

				var rl = readline.createInterface(
				{
					input: process.stdin,
					output: process.stdout
				} );

				rl.question( 'Skill to do: '.yellow, function ( answer )
				{
					rl.close();

					selections[ _c ] = {
						skill: me.team.characters[ _c ].class.skills[ answer ].id,
						target: null
					};

					rl = readline.createInterface(
					{
						input: process.stdin,
						output: process.stdout
					} );

					rl.question( 'Target: '.yellow, function ( answer )
					{

						for ( var _i in he.team.characters )
							console.log( '\tCharacter ' + _i + ': ' + he.team.characters[ _i ].name );

						selections[ _c ].target = {
							player: Constants.PLAYER_RIVAL,
							character: answer
						};
						rl.close();
						def.resolve();
					} );
				} );

			}
		};
	};

	var last_defer = Q.defer();
	var last_promise = last_defer.promise;
	for ( var _c in me.team.characters )
	{
		var c = me.team.characters[ _c ];
		if ( c.alive )
		{
			var def = Q.defer();
			last_promise.then( ask_selection_question( _c, def ) );
			last_promise = def.promise;
		}
	}

	last_defer.resolve();
	last_promise.then( function ()
	{
		if ( currently_in_decision_phase )
		{
			currently_in_decision_phase = false;
			log.info( 'Wait for the other player...', 'WAIT' );
			socket.emit( Constants.DECISION_MADE_EVENT, selections );
		}
		else
		{
			log.warn( 'A timeout happened!' );
		}
	} );
};

socket.on( Constants.DECISIONS_PHASE_END_EVENT, function ()
{
	currently_in_decision_phase = false;
	log.info( 'Decisions phase ended!' );
} );

socket.on( Constants.ROUND_RESULTS_EVENT, function ( decisions )
{
	for ( var i in decisions.actions )
	{
		var target = {};
		if ( decisions.players[ i ] === Constants.PLAYER_RIVAL && decisions.actions[ i ].target.player === Constants.PLAYER_RIVAL || decisions.players[ i ] === Constants.PLAYER_SELF && decisions.actions[ i ].target.player === Constants.PLAYER_SELF )
			target = me.team.characters[ decisions.actions[ i ].target.character ];
		else
			target = he.team.characters[ decisions.actions[ i ].target.character ];

		if ( decisions.players[ i ] === Constants.PLAYER_RIVAL )
			log.status( he.name + ' ordered ' + decisions.characters[ i ].name + ' to use ' + decisions.actions[ i ].skill + ' against ' + target.name + ', dealing ' + decisions.actions[ i ].damage + ' damage points', 'BATTLE' );
		else
			log.status( 'Your minion ' + decisions.characters[ i ].name + ' used ' + decisions.actions[ i ].skill + ' against ' + target.name + ', dealing ' + decisions.actions[ i ].damage + ' damage points', 'BATTLE' );

		target.stats[ Constants.HEALTH_STAT_ID ] -= decisions.actions[ i ].damage;
	}

} );

socket.on( Constants.DECISIONS_PHASE_START_EVENT, function ()
{
	decision_phase();
} );

socket.on( Constants.WIN_EVENT, function ()
{
	log.success( 'YOU WIN', 'GZ' );
	process.exit( 0 );
} );

socket.on( Constants.LOSE_EVENT, function ()
{
	log.error( 'Y0U L0S3', 'N00B' );
	process.exit( 0 );
} );