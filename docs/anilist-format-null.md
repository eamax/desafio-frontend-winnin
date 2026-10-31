# Live API correction: unspecified format

During the production-container browser smoke, All Formats showed upcoming titles with no scores despite popularity ordering. A read-only comparison against AniList isolated the cause:

- media(type:ANIME,search:null,sort:POPULARITY_DESC) returned Shingeki no Kyojin.
- media(type:ANIME,format:null,sort:POPULARITY_DESC) returned Chainsaw Man: Shikaku-hen.
- Omitting the optional format variable while retaining format:$format returned the expected popular title.

The model still uses null for All Formats, but the GraphQL variables object omits format in that case. This is an observed upstream behavior, not an assumption from GraphQL null semantics. The transport regression asserts omission. MSW race setup accepts the omitted value. Filtering to an explicit format remains unchanged. Test data and live content can change; the important invariant is wire omission for an unspecified filter.
