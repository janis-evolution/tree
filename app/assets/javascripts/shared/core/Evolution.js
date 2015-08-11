(function( this_or_window ){
	
	var is_nodejs = false;
	if( typeof exports != 'undefined' )
	{
		is_nodejs = true;
	}
	
	var Evolution = {};
	if( is_nodejs )
	{
		Evolution = this_or_window;
	}
	else
	{
		this_or_window.Evolution = Evolution;
	}
	
	/**
	 * known classes
	 */
	Evolution.classes = {};
	
	/**
	 * registration handlers
	 */
	Evolution.registration_handlers = {};
	
	Evolution.on_register = function( class_name, callback )
	{
		if( Evolution[ class_name ] )
		{
			callback();
		}
		else
		{
			if( !Evolution.registration_handlers[ class_name ] )
			{
				Evolution.registration_handlers[ class_name ] = [];
			}
			Evolution.registration_handlers[ class_name ].push( callback );
		}
	};
	
	/**
	 * registers new class and attaches event functionality
	 */
	Evolution.register = function( class_name, after, parent )
	{
		Evolution[ class_name ] = Evolution[ class_name ] || function(){};
		
		parent = parent || Evolution.Base;
		
		Evolution[ class_name ].prototype = new parent();
		Evolution.classes[ class_name ] = true;
		
		// copy base classes' class-wide methods
		for( var i in parent )
		{
			if( typeof parent[i] == 'function' )
			{
				Evolution[ class_name ][i] = parent[i];
			}
		}
		
		// store class name
		//Evolution[ class_name ].class_name = class_name;
		Evolution[ class_name ].prototype.class_name = class_name;
		
		// execute registration callbacks
		if( Evolution.registration_handlers[ class_name ] )
		{
			setTimeout(function() // this is required for class definition to fully execute
			{
				Evolution.registration_handlers[ class_name ].foreach(function( item )
				{
					item();
				});
			}, 0);
		}
	};
	
	/**
	 * controller namespaces
	 */
	Evolution.controllers = {};
	
})( this );

// fix less-than-ideal decision by standards committee :)
Array.prototype.foreach = Array.prototype.forEach;


