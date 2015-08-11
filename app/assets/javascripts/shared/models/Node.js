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
		'name',
	];
	
	/*
	 * parent()
	 */
	Evolution[ class_name ].prototype.parent = function()
	{
		return Evolution.Node.find( this.parent_id );
	}
	
	
})();
