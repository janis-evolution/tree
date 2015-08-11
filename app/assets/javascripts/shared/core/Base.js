(function(){
	
	/**
	 * This is a base class - do not instantiate it directly
	 *
	 * common events:
	 *   - mutate
	 *   - modify
	 *   - destroy
	 *   - obliterate
	 *   - synced
	 *   - load
	 */
	var class_name = 'Base';
	
	/*
	 * constructor
	 */
	Evolution[ class_name ] = function( values )
	{
		var self = this;
		
		// add empty values
		for( var i = 0; i < self.properties.length; i++ )
		{
			var name = self.properties[i];
			if( !( name in self ) )
			{
				self[ name ] = null;
			}
		}
		
		if( values !== undefined )
		{
			for( var name in values )
			{
				var value = values[ name ];
				
				if( self.properties.indexOf( name ) !== -1 )
				{
					self[ name ] = value;
				}
			}
		}
		
		// generate uuid
		if( self.properties.indexOf( 'uuid' ) !== -1 && !self.uuid )
		{
			self.id = self.uuid = UUID.generate();
		}
		self.change_timestamps = {};
		self.previous_values = {};
		self.set_baseline();
		self.properties.foreach(function( property )
		{
			self.change_timestamps[ property ] = new Date().getTime();
			self.previous_values[ property ] = undefined;
		});
		
		return self;
	}
	
	/********** class level mehods **********/
	
	/**
	 * class_name()
	 */
	Evolution[ class_name ].class_name = function()
	{
		for( var i in Evolution )
		{
			if( this === Evolution[i] )
			{
				return i;
			}
		}
		return 'Base';
	};
	
	/**
	 * on()
	 */
	Evolution[ class_name ].on = function( type, handler )
	{
		if( !this.events )
		{
			this.events = {};
		}
		if( !(type in this.events) )
		{
			this.events[ type ] = [];
		}
		this.events[ type ].push( handler );	
	};
	
	/**
	 * trigger()
	 */
	Evolution[ class_name ].trigger = function( type, args )
	{
		if( this.events[type] )
		{
			for( var i = 0; i < this.events[type].length; i++ )
			{
				this.events[type][i].apply( this, args || [] );
			}
		}
	};
	
	/*
	 * find()
	 */
	Evolution[ class_name ].find = function( id_or_finder )
	{
		if( typeof id_or_finder == 'function' )
		{
			return Evolution.db.first( this.class_name(), id_or_finder );
		}
		return Evolution.db.retrieve( this.class_name(), id_or_finder );
	};
	
	/*
	 * create_or_update()
	 */
	Evolution[ class_name ].create_or_update = function( id, values )
	{
		var instance = Evolution[ this.class_name() ].find( id );
		var instance_exists = !!instance;
		if( !instance_exists )
		{
			instance = new Evolution[ this.class_name() ]();
			instance.id = instance.uuid = id;
			Evolution.db.insert( this.class_name(), instance );
		}
		if( values )
		{
			for( var name in values )
			{
				var value = values[ name ];
				if( instance.properties.indexOf( name ) !== -1 )
				{
					instance[ name ] = value;
				}
			}
		}
		return instance;
	};
	
	/*
	 * all()
	 */
	Evolution[ class_name ].all = function( condition, include_deleted )
	{
		condition = condition || function(){ return true };
		return Evolution.u.toArray( Evolution.db.collect( this.class_name(), condition, include_deleted ) );
	};
	
	/********** instance level mehods **********/
	
	Evolution[ class_name ].prototype.class_name = class_name;
	
	Evolution[ class_name ].prototype.mutated_at = 0;
	
	/**
	 * class properties - these will be read from and updated back to server
	 */
	Evolution[ class_name ].prototype.properties = [];
	
	/**
	 * on()
	 *
	 * this is an override for class-level Evolution[ class_name ].on() method
	 */
	Evolution[ class_name ].prototype.on = function( type, handler )
	{
		if( !this.events )
		{
			this.events = {};
		}
		if( !this.events[ type ] )
		{
			this.events[ type ] = [];
		}
		if( typeof handler == 'function' )
		{
			this.events[ type ].push( handler );
		}
	};
	
	/**
	 * once()
	 *
	 * this is an override for class-level Evolution[ class_name ].once() method
	 */
	Evolution[ class_name ].prototype.once = function( type, handler )
	{
		if( !this.one_time_events )
		{
			this.one_time_events = {};
		}
		if( !this.one_time_events[ type ] )
		{
			this.one_time_events[ type ] = [];
		}
		if( typeof handler == 'function' )
		{
			this.one_time_events[ type ].push( handler );
		}
	};
	
	/**
	 * trigger()
	 */
	Evolution[ class_name ].prototype.trigger = function( type, args )
	{
		// first trigger instance-specific handlers
		if( this.events && this.events[type] )
		{
			for( var i = 0; i < this.events[type].length; i++ )
			{
				this.events[type][i].apply( this, args );
			}
		}
		// after those trigger one-time instance-specific handlers and clear them out
		if( this.one_time_events && this.one_time_events[type] )
		{
			for( var i = 0; i < this.one_time_events[type].length; i++ )
			{
				this.one_time_events[type][i].apply( this, args );
			}
			this.one_time_events[type] = [];
		}
		// then class wide handlers
		var instanceClassName;
		for( var j in Evolution.classes )
		{
			instanceClassName = j;
			if( this instanceof Evolution[ instanceClassName ] && Evolution[ instanceClassName ].events && Evolution[ instanceClassName ].events[type] )
			{
				for( var i = 0; i < Evolution[ instanceClassName ].events[type].length; i++ )
				{
					Evolution[ instanceClassName ].events[type][i].apply( this, args || [] );
				}
				break;
			}
		}
		if( type == 'mutate' )
		{
			this.update_change_timestamps();
			this.set_baseline();
		}
	};
	
	/**
	 * trigger_modification()
	 */
	Evolution[ class_name ].prototype.trigger_modification = function( changed_property )
	{
		// reflect changes to the dom
		this.trigger( 'mutate', [ changed_property ] );
		// and to the database
		this.trigger( 'modify', [ changed_property ] );
	};
	
	/**
	 * set()
	 */
	Evolution[ class_name ].prototype.set = function( name, value )
	{
		if( this[ name ] !== value )
		{
			this[ name ] = value;
			this.trigger_modification( name );
		}
	};
	
	/**
	 * toggle()
	 */
	Evolution[ class_name ].prototype.toggle = function( property )
	{
		this.set( property, !this[ property ] );
	}
	
	/*
	 * set_baseline()
	 */
	Evolution[ class_name ].prototype.set_baseline = function()
	{
		var self = this;
		self.baseline_values = {};
		self.properties.foreach(function( name )
		{
			self.baseline_values[ name ] = self[ name ];
		});
	};
	
	/*
	 * get_baseline()
	 */
	Evolution[ class_name ].prototype.get_baseline = function()
	{
		var self = this;
		if( self.baseline_values )
		{
			return self.baseline_values;
		}
		return null;
	};
	
	/*
	 * changes()
	 *
	 * return hash with changes - by default since last mutation event, but optionally after a timestamp
	 */
	Evolution[ class_name ].prototype.changes = function( since )
	{
		var self = this;
		var changes = {};
		// avoid property and method collisions
		var properties = [];
		self.properties.foreach(function( property )
		{
			if( typeof self[ property ] != 'function' )
			{
				properties.push( property );
			}
			else
			{
				console.warn( 'WARNING: ' + self.class_name + ' has property collision: ' + property );
			}
		});
		if( since === undefined )
		{
			var compared_to = self.get_baseline();
			if( compared_to )
			{
				properties.foreach(function( property )
				{
					if( compared_to[ property ] !== self[ property ] )
					{
						changes[ property ] = { from: compared_to[ property ], to: self[ property ] };
					}
				});
			}
		}
		else
		{
			var change_timestamps = self.change_timestamps || {};
			properties.foreach(function( property )
			{
				if( change_timestamps[ property ] && change_timestamps[ property ] > since )
				{
					changes[ property ] = { from: self.previous_values[ property ], to: self[ property ] };
				}
			});
		}
		return changes;
	};
	
	/*
	 * update_change_timestamps()
	 */
	Evolution[ class_name ].prototype.update_change_timestamps = function()
	{
		var self = this;
		if( !self.change_timestamps )
		{
			self.change_timestamps = {};
		}
		if( !self.previous_values )
		{
			self.previous_values = {};
		}
		var changes = self.changes();
		for( var property in changes )
		{
			self.change_timestamps[ property ] = new Date().getTime();
			self.previous_values[ property ] = changes[ property ].from;
		}
	};
	
	/*
	 * destroy()
	 */
	Evolution[ class_name ].prototype.destroy = function()
	{
		this.deleted = true;
		// reflect changes to the dom
		this.trigger( 'destroy' );
		// and to the database
		this.trigger( 'obliterate' );
	}
	
	/*
	 * to_post_data()
	 *
	 * returns an object containing only saveable properties
	 */
	Evolution[ class_name ].prototype.to_post_data = function( since )
	{
		var self = this;
		var values = {};
		var changes = self.changes( since );
		for( var i in changes )
		{
			values[i] = self[i];
		}
		if( !('uuid' in values) && this.uuid )
		{
			values.uuid = this.uuid;
		}
		if( this.deleted )
		{
			values.deleted = this.deleted;
		}
		return values;
	}
	
})();
