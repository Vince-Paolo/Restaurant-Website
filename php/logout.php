<?php
// php/logout.php
session_start();
session_unset();
session_destroy();

// Clear the session cookie
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 3600, '/');
}

header('Location: ../login.html');
exit();
