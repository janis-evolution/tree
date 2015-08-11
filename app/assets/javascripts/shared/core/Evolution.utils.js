Evolution.utils =
{
	to_array: function( object )
	{
		if( object instanceof Array )
		{
			return object;
		}
		var array = [];
		for( var i in object )
		{
			array.push( object[i] );
		}
		return array;
	}
}

Evolution.u = Evolution.utils;
Evolution.u.toArray = Evolution.u.to_array;
