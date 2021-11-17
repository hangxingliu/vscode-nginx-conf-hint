import { toMarkdown } from "../src/utils/helper";

const html = "<p>If <code>accept_mutex</code> is enabled, worker processes will accept new connections by turn. Otherwise, all worker processes will be notified about new connections, and if volume of new connections is low, some of the worker processes may just waste system resources.</p><blockquote class=\"note\">There is no need to enable <code>accept_mutex</code> on systems that support the <a href=\"https://nginx.org/en/docs/events.html#epoll\">EPOLLEXCLUSIVE</a> flag (1.11.3) or when using <a href=\"https://nginx.org/en/docs/http/ngx_http_core_module.html#reuseport\">reuseport</a>.</blockquote><blockquote class=\"note\">Prior to version 1.11.3, the default value was <code>on</code>.</blockquote>";
console.log(toMarkdown(html));
