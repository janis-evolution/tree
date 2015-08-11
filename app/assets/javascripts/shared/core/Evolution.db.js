Evolution.db =
{
	/**
	 * private variable where data is stored
	 * DO NOT use this directly
	 */
	storage: {},
	/**
	 * inserts an object in store
	 */
	insert: function( className, object, key )
	{
		if( key === undefined )
		{
			key = object.uuid || object.id;
		}
		if( Evolution.db.storage[ className ] === undefined )
		{
			Evolution.db.storage[ className ] = {};
		}
		Evolution.db.storage[ className ][ key ] = object;
		return true;
	},
	/**
	 * retrieve an object from store by id
	 */
	retrieve: function( className, key )
	{
		var store = Evolution.db.storage;
		if( store[ className ] && store[ className ][ key ] )
		{
			return store[ className ][ key ];
		}
		return null;
	},
	/**
	 * load a batch of objects
	 */
	load: function( data )
	{
		var instances = [], deleted = [];
		for( var class_name in data )
		{
			var store = data[ class_name ];
			for( var i in store )
			{
				var values = store[ i ] || {};
				if( typeof values != 'function' )
				{
					var id = values.uuid || values.id;
					values.id = id;
					if( typeof Evolution[ class_name ] == 'function' )
					{
						// detect deletion
						var existing = Evolution.db.retrieve( class_name, id );
						if( existing )
						{
							if ( !existing.deleted && values.deleted )
							{
								deleted.push( existing );
							}
							else if ( 'delta' in values )
							{
								values = values.delta;
							}
						}
						var instance = Evolution[ class_name ].create_or_update( id, values );
						instances.push( instance );
					}
					else if( class_name != 'source_token' )
					{
						console.error( 'Evolution.' + class_name + ' not loaded' );
					}
				}
			}
		}
		// trigger load events
		instances.foreach(function( instance )
		{
			instance.trigger( 'beforeload' );
			instance.trigger( 'load' );
		});
		// trigger destroy events
		deleted.foreach(function( instance )
		{
			instance.trigger( 'destroy' );
		});
		return instances;
	},
	/**
	 * destroy object
	 */
	destroy: function( className, key )
	{
		if( Evolution.db.storage[ className ] === undefined )
		{
			Evolution.db.storage[ className ] = {};
		}
		delete Evolution.db.storage[ className ][ key ];
		return true;
	},
	/**
	 * collect objects
	 */
	collect: function( className, callback, include_deleted )
	{
		var collection = {};
		var store = Evolution.db.storage;
		if( store[ className ] === undefined )
		{
			store[ className ] = {};
		}
		for( var key in store[ className ] )
		{
			var item = store[ className ][ key ];
			if
			(
				( include_deleted || !item.deleted )
				&&
				callback( item )
			)
			{
				collection[ key ] = item;
			}
		}
		return collection;
	},
	/**
	 * return first object that satisfies callback
	 */
	first: function( className, callback, include_deleted )
	{
		var store = Evolution.db.storage;
		if( store[ className ] === undefined )
		{
			store[ className ] = {};
		}
		for( var key in store[ className ] )
		{
			var item = store[ className ][ key ];
			if
			(
				( !item.deleted || include_deleted )
				&&
				callback( item )
			)
			{
				return item;
			}
		}
		return null;
	},
	/**
	 * dumps all storage to localStorage
	 */
	persist: function( key, filter )
	{
		key = 'Evolution.db.storage.' + key;
		var storage = Evolution.db.storage;
		if( typeof filter == 'function' )
		{
			storage = {};
			for( var i in Evolution.classes )
			{
				storage[ i ] = Evolution.db.collect( i, filter );
			}
		}
		localStorage.setItem( key, JSON.stringify( storage ) );
	},
	/**
	 * restores storage from localStorage
	 */
	restore: function( key, filter )
	{
		key = 'Evolution.db.storage.' + key;
		var json = localStorage.getItem( key );
		if( json )
		{
			var full = storage = JSON.parse( json );
			if( typeof filter == 'function' )
			{
				storage = {};
				for( var className in Evolution.classes )
				{
					storage[ className ] = {};
					for( var i in full[ className ] )
					{
						if( filter( full[ className ][ i ] ) )
						{
							storage[ className ][ i ] = full[ className ][ i ];
						}
					}
				}
			}
			Evolution.db.load( storage );
		}
	}
}
