jQuery(function()
{
	var controller = jQuery( '.controller-tree' );
	var tree = controller.find( '.tree' );
	
	var key = 'nodes';
	
	var persistence_timeout;
	
	var persistence_filter = function( candidate )
	{
		return candidate instanceof Evolution.Node && !candidate.is_root();
	}
	
	var modification_handler = function()
	{
		// use zero-length timeout to limit update rate - a single user interaction may trigger many events,
		// but a single write operation is enough to store all data
		clearTimeout( persistence_timeout );
		persistence_timeout = setTimeout(function()
		{
			console.log( 'save to localStorage' );
			Evolution.db.persist( key, persistence_filter );
		},0);
	}
	
	// bind modification event handler
	Evolution.Node.on( 'modify',     modification_handler );
	Evolution.Node.on( 'obliterate', modification_handler );
	
	// construct handlebars template
	var node_template = Handlebars.compile( controller.find( 'script.node_template' ).html() );
	
	Evolution.Node.on( 'modify', function( changed_property )
	{
		var self = this;
		if( self.deleted )
		{
			return;
		}
		console.group( 'modification handler for ' + self.hierarchy_no() + ' ' + self.uuid );
		console.log( self );
		console.log( 'changed_property:', changed_property );
		// update all descendants if order_no has changes
		if( changed_property == 'order_no' )
		{
			self.descendants().foreach(function( descendant )
			{
				descendant.trigger( 'mutate' );
			});
		}
		console.groupEnd();
	});
	
	Evolution.Node.on( 'mutate', function()
	{
		var self = this;
		if( self.deleted )
		{
			return;
		}
		console.groupCollapsed( 'Node:mutate - ' + self.hierarchy_no() + ' (' + self.uuid + ')' );
		console.log( self );
		console.log( 'changes', self.changes() );
		// find dom node
		var dom_node = controller.find( '.node[data-uuid="' + self.uuid + '"] > .body' );
		dom_node.find( '.hierarchy_no' ).html( self.hierarchy_no() );
		console.groupEnd();
	});
	
	Evolution.Node.on( 'destroy', function()
	{
		var self = this;
		console.group( 'destruction handler for ' + self.hierarchy_no() + ' ' + self.uuid );
		console.log( self );
		// find dom node
		var dom_node = controller.find( '.node[data-uuid="' + self.uuid + '"]' );
		dom_node.remove();
		console.groupEnd();
	});
	
	tree.on( 'click', 'button[name="add_child"]', function()
	{
		var target = jQuery( this );
		console.group( '"' + target.attr( 'name' ) + '" clicked' );
		// find parent
		var parent_node = target.parents( '.node' ).first();
		var parent_id = parent_node.attr( 'data-uuid' );
		var parent = Evolution.Node.find( parent_id );
		var node = parent.create_child();
		var html = node_template( node );
		parent_node.children( '.children' ).append( html );
		node.trigger_modification();
		console.groupEnd();
	});
	
	tree.on( 'click', 'button[name="add_before"], button[name="add_after"]', function()
	{
		var target = jQuery( this );
		console.group( '"' + target.attr( 'name' ) + '" clicked' );
		// find parent
		var insertion_node = target.parents( '.node' ).first();
		var sibling = Evolution.Node.find( insertion_node.attr( 'data-uuid' ) );
		// find order no
		var node = sibling.create_sibling( target.attr( 'name' ) == 'add_before' );
		var html = node_template( node );
		if( target.attr( 'name' ) == 'add_before' )
		{
			insertion_node.before( html );
		}
		else
		{
			insertion_node.after( html );
		}
		node.trigger_modification();
		console.groupEnd();
	});
	
	tree.on( 'click', 'button[name="destroy"]', function()
	{
		var target = jQuery( this );
		console.group( '"' + target.attr( 'name' ) + '" clicked' );
		// find entry
		var node_id = target.parents( '.node' ).first().attr( 'data-uuid' );
		var node = Evolution.Node.find( node_id );
		// destroy self
		node.destroy();
		console.groupEnd();
	});
	
	// create a virtual root node
	var root = Evolution.Node.create_or_update( 'root', {} );
	
	// load Nodes stored in localStorage
	var instances = Evolution.db.restore( key );
	
	var render = function( node )
	{
		var append_to = controller.find( '.node[data-uuid="' + node.uuid + '"] .children' );
		node.children().foreach(function( child )
		{
			append_to.append( node_template( child ) );
			child.trigger( 'mutate' );
			render( child );
		});
	}
	
	var render_iterative = function( root )
	{
		var level = root.children();
		var next_level = [];
		while( level.length > 0 )
		{
			next_level = [];
			level.foreach(function( node )
			{
				// collect children for next pass
				next_level = next_level.concat( node.children() );
				// add this node to dom
				controller.find( '.node[data-uuid="' + node.parent( true ).uuid + '"] > .children' ).append( node_template( node ) );
				node.trigger( 'mutate' );
			});
			level = next_level;
		}
	}
	
	render( root );
	//render_iterative( root );
	
});
