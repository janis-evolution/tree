# Tree Assignment for Evolution Gaming

## Static Run (no Rails)

Setup instructions:

    git clone git@github.com:janis-evolution/tree.git
    cd tree
    npm install

To run the app, open ```index.html``` in a browser.

To run tests:

    ./node_modules/karma/bin/karma start

## Full App

This is a Ruby on Rails app. RVM was used in development, but it is not mandatory.

Setup instructions:

    git clone git@github.com:janis-evolution/tree.git
    cd tree
    bundle install
    npm install

To run the app:

    rails s

To run tests:

    rake karma:start
    rake karma:run #single run

Karma is wrapped in a rake task to load javascript files from Rails Asset Pipeline (APPLICATION_SPEC line in karma.conf.js).
