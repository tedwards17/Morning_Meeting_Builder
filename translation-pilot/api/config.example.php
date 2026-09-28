<?php
// COPY OUTSIDE DOCUMENT ROOT. Replace every placeholder; never commit real values.
return [
 'dsn'=>'mysql:host=localhost;dbname=CPANELPREFIX_mmb;charset=utf8mb4',
 'user'=>'CPANELPREFIX_mmb_app', 'password'=>'REPLACE_WITH_RANDOM_DATABASE_PASSWORD',
 'media_dir'=>'/home/CPANEL_ACCOUNT/morning-meeting-private/media',
 'origin'=>'https://meetings.example.invalid',
 'max_image_bytes'=>15*1024*1024, 'max_storage_bytes'=>10*1024*1024*1024,
 'session_days'=>90,
 // Optional Azure Speech + Azure Translator resources for live captions.
 // Keep these values in this private server configuration, never in browser files.
 'speech_key'=>'', 'speech_region'=>'',
 'translator_key'=>'', 'translator_region'=>'',
];
