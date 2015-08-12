describe( "Node model", function()
{
	var root, a, aa, ab, aaa, b, c;
	
	// utility method to filter out ids of a collection of Node items
	// this makes failed tests much more readable
	var ids = function( nodes )
	{
		var array_of_ids = [];
		nodes.foreach(function( node )
		{
			array_of_ids.push( node.uuid );
		});
		return array_of_ids;
	}
	
	beforeEach(function()
	{
		root = Evolution.Node.create_or_update( 'root', {} );
		// create root level nodes
		a = Evolution.Node.create_or_update( 'a', { order_no: 0 } );
		b = Evolution.Node.create_or_update( 'b', { order_no: 1 } );
		c = Evolution.Node.create_or_update( 'c', { order_no: 2 } );
		// create a's children
		aa = Evolution.Node.create_or_update( 'aa', { parent_id: 'a', order_no: 0 } );
		ab = Evolution.Node.create_or_update( 'ab', { parent_id: 'a', order_no: 1 } );
		// create aa's child
		aaa = Evolution.Node.create_or_update( 'aaa', { parent_id: 'aa', order_no: 0 } );
	});
	
	afterEach(function()
	{
		// clear out storage
		Evolution.db.storage = {};
		root = a = aa = ab = aaa = b = c = null;
	});
	
	it( "exists", function()
	{
		expect( typeof Evolution.Node ).toBe( 'function' );
	});
	it( "can be root", function()
	{
		expect( root.is_root() ).toBe( true );
		expect( a.is_root() ).toBe( false );
	});
	it( "can collect all items", function()
	{
		expect( Evolution.Node.all().length ).toEqual( 7 );
	});
	it( "can have a parent", function()
	{
		expect( a.parent() ).toEqual( null );
		expect( aa.parent() ).toBe( a );
	});
	it( "has children", function()
	{
		expect( ids( root.children() ) ).toEqual( [ 'a', 'b', 'c' ] );
		expect( ids( a.children() ) ).toEqual( [ 'aa', 'ab' ] );
		expect( ids( b.children() ) ).toEqual( [] );
		expect( ids( aa.children() ) ).toEqual( [ 'aaa' ] );
	});
	it( "has siblings", function()
	{
		expect( ids( a.siblings() ) ).toEqual( [ 'b', 'c' ] );
		expect( ids( b.siblings() ) ).toEqual( [ 'a', 'c' ] );
		expect( ids( aa.siblings() ) ).toEqual( [ 'ab' ] );
	});
	it( "has descendants", function()
	{
		expect( ids( a.descendants() ) ).toEqual( [ 'aa', 'ab', 'aaa' ] );
		expect( ids( b.descendants() ) ).toEqual( [] );
		expect( ids( aa.descendants() ) ).toEqual( [ 'aaa' ] );
	});
	it( "has ancestors", function()
	{
		expect( ids( a.ancestors() ) ).toEqual( [] );
		expect( ids( aa.ancestors() ) ).toEqual( [ 'a' ] );
		expect( ids( aaa.ancestors() ) ).toEqual( [ 'a', 'aa' ] );
	});
	it( "has hierarchy_no", function()
	{
		expect( a.hierarchy_no() ).toEqual( '1.' );
		expect( c.hierarchy_no() ).toEqual( '3.' );
		expect( aa.hierarchy_no() ).toEqual( '1.1.' );
		expect( ab.hierarchy_no() ).toEqual( '1.2.' );
		expect( aaa.hierarchy_no() ).toEqual( '1.1.1.' );
	});
	it( "updates order_no when deleted", function()
	{
		aa.destroy();
		expect( ab.order_no ).toEqual( 0 );
	});
	it( "destroys own descendants when deleted", function()
	{
		aa.destroy();
		expect( ids( a.children() ) ).toEqual( [ 'ab' ] );
		expect( ids( a.descendants() ) ).toEqual( [ 'ab' ] );
	});
	
	
});

