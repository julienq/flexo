// Simple route that just returns the given status

exports.routes = [
  ["^/status/(\\d+)$", { GET: function (transaction, status) {
    transaction.plain_status(status);
  } }]
];

