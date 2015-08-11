(function(){

	var class_name = 'Node';
	
	Evolution[ class_name ] = function()
	{
		Evolution.Base.apply( this, arguments );
	}
	
	Evolution.register( class_name );

	/*
	 * class properties
	 */
	Evolution[ class_name ].prototype.properties =
	[
		'uuid',
		'parent_id',
		'order_no',
	];
	
	Evolution[ class_name ].prototype.order_no = 0;
	
	/*
	 * is_root()
	 */
	Evolution[ class_name ].prototype.is_root = function()
	{
		return this.uuid == 'root';
	}
	
	/*
	 * get_uuid()
	 */
	Evolution[ class_name ].prototype.get_uuid = function()
	{
		var self = this;
		if( self.is_root() )
		{
			return null;
		}
		return self.uuid;
	}
	
	/*
	 * parent()
	 */
	Evolution[ class_name ].prototype.parent = function( return_root_on_empty )
	{
		var self = this;
		var parent_id = self.parent_id;
		if( return_root_on_empty && !self.is_root() )
		{
			parent_id = parent_id || 'root';
		}
		return Evolution.Node.find( parent_id );
	}
	
	/*
	 * children()
	 */
	Evolution[ class_name ].prototype.children = function( order_no )
	{
		var self = this;
		var children = Evolution[ class_name ].all(function( candidate )
		{
			return candidate.parent_id == self.get_uuid() && !candidate.is_root();
		});
		children.sort(function( a, b ){ return a.order_no - b.order_no });
		return children;
	}
	
	/*
	 * children_after()
	 */
	Evolution[ class_name ].prototype.children_after = function( order_no )
	{
		var self = this;
		var children = Evolution[ class_name ].all(function( candidate )
		{
			return candidate.parent_id == self.get_uuid() && candidate.order_no >= order_no && !candidate.is_root();
		});
		return children;
	}
	
	/*
	 * ancestors()
	 */
	Evolution[ class_name ].prototype.ancestors = function()
	{
		var self = this;
		if( !self.parent() )
		{
			return [];
		}
		var ancestors = self.parent().ancestors();
		ancestors.push( self.parent() );
		return ancestors;
	}
	
	/*
	 * ancestor_ids()
	 */
	Evolution[ class_name ].prototype.ancestor_ids = function()
	{
		var self = this;
		var ids = [];
		self.ancestors().foreach(function( ancestor )
		{
			ids.push( ancestor.uuid );
		});
		return ids;
	}
	
	/*
	 * descendants()
	 */
	Evolution[ class_name ].prototype.descendants = function()
	{
		var self = this;
		var children = Evolution[ class_name ].all(function( candidate )
		{
			return candidate.ancestor_ids().indexOf( self.get_uuid() ) > -1;
		});
		return children;
	}
	
	/*
	 * siblings()
	 */
	Evolution[ class_name ].prototype.siblings = function()
	{
		return this.parent( true ).children();
	}
	
	/*
	 * hierarchy_no()
	 */
	Evolution[ class_name ].prototype.hierarchy_no = function()
	{
		var self = this;
		
		var base = '';
		if( self.parent() )
		{
			base = self.parent().hierarchy_no();
		}
		
		return base + ( self.order_no + 1 ) + '.';
	}
	
	/*
	 * destroy
	 *
	 * destroy child nodes before destroying self
	 */
	var destroy = Evolution[ class_name ].prototype.destroy;
	Evolution[ class_name ].prototype.destroy = function()
	{
		var self = this;
		
		self.children().foreach(function( child )
		{
			child.destroy();
		});
		
		return destroy.apply( this, arguments );
	}
	
	
})();
