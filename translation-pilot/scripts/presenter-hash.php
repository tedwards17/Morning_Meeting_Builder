<?php
// Read a passphrase from stdin, never a command argument or a committed file.
$phrase = trim(stream_get_contents(STDIN));
if (strlen($phrase) < 12 || strlen($phrase) > 256) { fwrite(STDERR, "Use a passphrase between 12 and 256 bytes.\n"); exit(1); }
echo password_hash($phrase, PASSWORD_DEFAULT).PHP_EOL;
