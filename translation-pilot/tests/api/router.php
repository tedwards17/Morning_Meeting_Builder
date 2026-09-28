<?php
if(str_contains($_SERVER['REQUEST_URI'],'/api/v1/')){require __DIR__.'/../../api/index.php';return true;}
return false;
