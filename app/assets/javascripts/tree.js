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
	
	var find_or_create = function( node )
	{
		var dom_node = controller.find( '.node[data-uuid="' + node.uuid + '"]' );
		var parent_dom_node = tree; // root level by default
		if( node.parent() )
		{
			parent_dom_node = find_or_create( node.parent() );
		}
		if( dom_node.length == 0 )
		{
			parent_dom_node.children( '.children' ).append( node_template() );
		}
	}
	
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
		dom_node.find( '.name' ).html( self.uuid );
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
		if( parent_id == 'root' )
		{
			parent_id = null;
		}
		// find order no
		var order_no = parent.children().length;
		// create new Node entry
		var node = new Evolution.Node({ parent_id: parent_id, order_no: order_no });
		Evolution.db.insert( 'Node', node );
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
		var parent_node = insertion_node.parents( '.node' ).first();
		var parent_id = parent_node.attr( 'data-uuid' );
		var sibling = Evolution.Node.find( insertion_node.attr( 'data-uuid' ) );
		var parent = Evolution.Node.find( parent_id );
		if( parent_id == 'root' )
		{
			parent_id = null;
		}
		// find order no
		var order_no = sibling.order_no;
		if( target.attr( 'name' ) == 'add_after' )
		{
			order_no++;
		}
		// create new Node entry
		var node = new Evolution.Node({ parent_id: parent_id, order_no: order_no });
		// update order no of all following children
		var children_after = node.siblings().filter(function( candidate ){ return candidate.order_no >= order_no });
		children_after.foreach(function( child )
		{
			child.set( 'order_no', child.order_no + 1 );
		});
		Evolution.db.insert( 'Node', node );
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
		// update next siblings
		var children_after = node.siblings().filter(function( candidate ){ return candidate.order_no > node.order_no });
		children_after.foreach(function( child )
		{
			child.set( 'order_no', child.order_no - 1 );
		});
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
	
	render( root );
	
});
