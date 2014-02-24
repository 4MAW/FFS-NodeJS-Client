// Dependencies.

var Q = require( 'q' ),
	request = require( 'request' ),
	config = require( '../config.js' );

// Settings.

var baseURL = config.baseURL + ':' + config.port;

// Methods.

function load_skill( skill )
{
	var defer = Q.defer();

	request( baseURL + '/skill/' + skill.id, function ( err, res )
	{
		if ( err ) defer.reject( err );
		else
		{
			defer.resolve( JSON.parse( res.body ) );
		}
	} );

	return defer.promise;
}

function load_skills( skills )
{
	var s = [];

	var assign_skill = function ( _s, skills )
	{
		return function ( skill )
		{
			s[ _s ] = skill;
		};
	};

	var skills_promises = [];
	for ( var _s in skills )
		skills_promises.push( load_skill( skills[ _s ] ).then( assign_skill( _s, skills ) ) );

	var defer = Q.defer();
	Q.all( skills_promises ).then( function ()
	{
		defer.resolve( s );
	} );
	return defer.promise;
}

function load_class( _class )
{
	var defer = Q.defer();

	request( baseURL + '/class/' + _class.id, function ( err, res )
	{
		if ( err ) defer.reject( err );
		else
		{
			var _class = JSON.parse( res.body );
			load_skills( _class.skills ).then( function ( skills )
			{
				_class.skills = skills;
				defer.resolve( _class );
			} );
		}
	} );

	return defer.promise;
}

function load_character( character )
{
	var defer = Q.defer();

	request( baseURL + '/character/' + character.id, function ( err, res )
	{
		if ( err ) defer.reject( err );
		else
		{
			var character = JSON.parse( res.body );
			load_class( character.class ).then( function ( _class )
			{
				character.class = _class;
				defer.resolve( character );
			} );
		}
	} );

	return defer.promise;
}

function load_team( team )
{
	var assign_character = function ( _c, team )
	{
		return function ( character )
		{
			var prev = team.characters[ _c ];
			team.characters[ _c ] = JSON.parse( JSON.stringify( character ) );
			team.characters[ _c ].stats = prev.stats;
			team.characters[ _c ].alive = prev.alive;
		};
	};

	var character_promises = [];
	for ( var _c in team.characters )
	{
		var promise = load_character( team.characters[ _c ] ).then( assign_character( _c, team ) );
		character_promises.push( promise );
	}

	return Q.all( character_promises );
}

function load_teams( teams )
{
	var team_promises = [];
	for ( var _t in teams )
		team_promises.push( load_team( teams[ _t ] ) );
	return Q.all( team_promises );
}

function get_team( team_id )
{
	var defer = Q.defer();

	request( baseURL + '/team/' + team_id, function ( err, res )
	{
		if ( err ) defer.reject( err );

		var team = JSON.parse( res.body );

		load_team( team ).then( function ()
		{
			defer.resolve( team );
		} );
	} );

	return defer.promise;
}

// Public methods.

module.exports = {
	loadTeam: load_team,
	loadTeams: load_teams,
	getTeam: get_team,
	loadClass: load_class,
	loadSkills: load_skills
};