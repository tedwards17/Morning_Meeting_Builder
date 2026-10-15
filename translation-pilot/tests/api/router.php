<?php
if(str_contains($_SERVER['REQUEST_URI'],'/api/v1/')){require __DIR__.'/../../api/index.php';return true;}
if(str_contains($_SERVER['REQUEST_URI'],'/translation-api/index.php')){require __DIR__.'/../../translation-api/index.php';return true;}
return false;
