var Constants = require( './constants.js' );

/**
 * Prints an array of teams.
 * @param  {array} teams Teams to print.
 */
function print_team_list( teams )
{
	for ( var _t in teams )
	{
		console.log( 'Team ' + _t + ' (' + teams[ _t ].name + '): ' );
		for ( var _c in teams[ _t ].characters )
		{
			var c = teams[ _t ].characters[ _c ];
			console.log( "\t " + c.name + ": " + c.class.name );
		}
	}
}

function print_stickman( left, right )
{

	var left_health = '',
		right_health = '',
		left_health_spacing = '                        ',
		right_health_spacing = '                        ';

	var left_name = '',
		right_name = '',
		left_name_spacing = '                        ',
		right_name_spacing = '                        ';

	if ( left && right )
	{
		left_health = '' + left.stats[ Constants.HEALTH_STAT_ID ];
		right_health = '' + right.stats[ Constants.HEALTH_STAT_ID ];
		left_name = '' + left.name;
		right_name = '' + right.name;
		head_right = ( right_health > 0 ) ? "O" : "X";
		head_left = ( left_health > 0 ) ? "O" : "X";
		console.log( "  " + head_left + "                     |                    " + head_right + "   " );
		console.log( " /|\\                    |                   /|\\  " );
		console.log( " _|_                    |                   _|_  " );
	}
	else if ( left )
	{
		left_health = '' + left.stats[ Constants.HEALTH_STAT_ID ];
		left_name = '' + left.name;
		head_left = ( left_health > 0 ) ? "O" : "X";
		console.log( "  " + head_left + "                     |                        " );
		console.log( " /|\\                    |                        " );
		console.log( " _|_                    |                        " );
	}
	else
	{
		right_health = '' + right.stats[ Constants.HEALTH_STAT_ID ];
		right_name = '' + right.name;
		head_right = ( right_health > 0 ) ? "O" : "X";
		console.log( "                        |                    " + head_right + "   " );
		console.log( "                        |                   /|\\  " );
		console.log( "                        |                   _|_  " );
	}

	left_health_spacing = left_health + left_health_spacing.substring( left_health.length, left_health_spacing.length );
	right_health_spacing = right_health_spacing.substring( right_health.length, right_health_spacing.length ) + right_health;
	console.log( left_health_spacing + '|' + right_health_spacing );

	left_name_spacing = left_name + left_name_spacing.substring( left_name.length, left_name_spacing.length );
	right_name_spacing = right_name_spacing.substring( right_name.length, right_name_spacing.length ) + right_name;
	console.log( left_name_spacing + '|' + right_name_spacing );

	console.log( "                        |                        " );
}

function print_battle_scenario( environment )
{
	var me = environment.me;
	var he = environment.he;
	var diff, i, j;

	he_name_str = "                  ";
	he_name_str = he_name_str.substring( 0, he_name_str.length - he.name.length );
	me_name_str = "                  ";
	me_name_str = me_name_str.substring( 0, me_name_str.length - me.name.length );

	console.log( he.name + he_name_str + " <-- vs. --> " + me_name_str + me.name );
	console.log( "========================|========================" );
	console.log( "                        |                        " );

	var amount_left = he.team.characters.length;
	var amount_right = me.team.characters.length;
	for ( i = 0; i < Math.max( amount_left, amount_right ); i++ )
		print_stickman( he.team.characters[ i ], me.team.characters[ i ] );

	console.log( "========================|========================" );

}

function print_skills( character )
{
	for ( var _i = 0; _i < character.class.skills.length; _i++ )
		console.log( "\t Skill " + _i + ": " + character.class.skills[ _i ].name );
}

module.exports = {
	printTeamList: print_team_list,
	printBattleScenario: print_battle_scenario,
	printSkills: print_skills
};