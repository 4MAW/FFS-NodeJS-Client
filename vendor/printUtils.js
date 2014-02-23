/**
 * Prints an array of teams.
 * @param  {array} teams Teams to print.
 */
function print_team_list( teams )
{
	for ( var _t in teams )
	{
		console.log( 'Team ' + _t + ' (' + teams[ _t ].name + '): ' );
		for ( var _c in teams[ _t ].characters );
		{
			var c = teams[ _t ].characters[ _c ];
			console.log( "\t " + c.name + ": " + c.class.name );
		}
	}
}

function print_stickman( left, right )
{
	if ( left && right )
	{
		console.log( "  O                     |                    O   " );
		console.log( " /|\\                    |                   /|\\  " );
		console.log( " _|_                    |                   _|_  " );
		console.log( "                        |                        " );
	}
	else if ( left )
	{
		console.log( "  O                     |                        " );
		console.log( " /|\\                    |                        " );
		console.log( " _|_                    |                        " );
		console.log( "                        |                        " );
	}
	else
	{
		console.log( "                        |                    O   " );
		console.log( "                        |                   /|\\  " );
		console.log( "                        |                   _|_  " );
		console.log( "                        |                        " );
	}
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

	if ( amount_right > amount_left )
	{
		diff = amount_right - amount_left;
		for ( i = 0; i < amount_left; i++ )
			print_stickman( true, true );
		for ( j = 0; j < diff; j++ )
			print_stickman( false, true );
	}
	else
	{
		diff = amount_left - amount_right;
		for ( i = 0; i < amount_right; i++ )
			print_stickman( true, true );
		for ( j = 0; j < diff; j++ )
			print_stickman( true, false );
	}

	console.log( "========================|========================" );

}

module.exports = {

	printTeamList: print_team_list,
	printBattleScenario: print_battle_scenario

};