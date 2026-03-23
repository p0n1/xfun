## Task  

Develop a website that displays X/Twitter posts from a list, which contains links to various X posts.  

## Requirements

### Principles

- Keep the code simple and easy to maintain.
- All external requests should be sent from the client side. The server side should only be used for static files.

### Tech Stack

- Use next.js framework.
- Use system font stack.
- Do not use Twitter API v2 because I don’t want to create an X developer account or use an API token.
- Use FxEmbed api. The API URL is like https://api.fxtwitter.com/SpaceX/status/1946437942265987384. The response is like [api_fxtwitter_response.1.json](fxtwitter_examlpes/api_fxtwitter_response.1.json) and [api_fxtwitter_response.2.json](fxtwitter_examlpes/api_fxtwitter_response.2.json).

### X posts data

- These X posts may be text-only, images only, videos only, or text, images and videos mixed.
- Some posts are using URL from twitter.com and some using x.com. Make sure to handle both cases.

### Design

- The website will be accessed from both mobile and desktop devices.
- The website should be responsive and look good on both mobile and desktop devices.
- This website will be used for kids to watch, satisfying and stimulating their curiosity.
- Each post should link to the original X post.
- We should play videos and photos directly on this website without redirecting to X.com.
- Each photo should be clickable to enlarge it.

## Test URLs for Demo

https://twitter.com/jack/status/20
https://twitter.com/elonmusk/status/1585841080431321088
https://twitter.com/joely7758521/status/1947472826489016745
https://x.com/niccruzpatane/status/1946967976005042231
https://x.com/SpaceX/status/1946437942265987384