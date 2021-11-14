# Nginx Configuration

> Notes from <https://nginx.org/en/docs/beginners_guide.html>

> nginx consists of modules which are controlled by directives specified in the configuration file.
> **Directives** are divided into **simple directives** and **block directives**. 
> A **simple directive** consists of the name and parameters separated by spaces and ends with a semicolon (;). 
> A **block directive** has the same structure as a simple directive, 
> but instead of the semicolon it ends with a set of additional instructions surrounded by braces ({ and }). 
> If a block directive can have other directives inside braces, 
> it is called a **context** (examples: `events`, `http`, `server`, and `location`).

> Directives placed in the configuration file outside of any contexts are considered to be in the main context. 
> The `events` and `http` directives reside in the main context, `server` in `http`, and `location` in `server`.
