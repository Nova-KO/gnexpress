<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $uploadDir = "uploads/";

    // Ensure upload directory exists
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    // Generate a unique file name
    $fileExtension = pathinfo($_FILES["file"]["name"], PATHINFO_EXTENSION);
    $uniqueFileName = uniqid("resume_", true) . "." . $fileExtension;
    $targetFilePath = $uploadDir . $uniqueFileName;

    // Move uploaded file to server
    if (move_uploaded_file($_FILES["file"]["tmp_name"], $targetFilePath)) {
        // Collect form data
        $fname = $_POST["fname"];
        $lname = $_POST["lname"];
        $email = $_POST["email"];
        $mobile = $_POST["mobile"];
        $about = $_POST["message"];
        // $recipient = "subinwhitecloud@gmail.com";  // Change to your email
        $recipient = "subinwhitecloud@gmail.com";  // Change to your email
        $subject = "New Job Application - $fname $lname";

        $message = "
        <p><strong>Name:</strong> $fname $lname</p>
        <p><strong>Email:</strong> $email</p>
        <p><strong>Mobile:</strong> $mobile</p>
        <p><strong>About:</strong> $about</p>
        <p><strong>Resume:</strong> Attached</p>
        ";

        $headers = "From: info@wisbato.com\r\n"; // Change to sender email
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: multipart/mixed; boundary=\"boundary\"\r\n";

        // Email body with attachment
        $emailBody = "--boundary\r\n";
        $emailBody .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";
        $emailBody .= "$message\r\n\r\n";
        $emailBody .= "--boundary\r\n";
        $emailBody .= "Content-Type: application/octet-stream; name=\"" . basename($uniqueFileName) . "\"\r\n";
        $emailBody .= "Content-Disposition: attachment; filename=\"" . basename($uniqueFileName) . "\"\r\n";
        $emailBody .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $emailBody .= chunk_split(base64_encode(file_get_contents($targetFilePath))) . "\r\n";
        $emailBody .= "--boundary--";

        // Send email with attachment
        if (mail($recipient, $subject, $emailBody, $headers)) {
            echo json_encode(["success" => true, "fileName" => $uniqueFileName]);
        } else {
            echo json_encode(["success" => false, "error" => "Email sending failed"]);
        }
    } else {
        echo json_encode(["success" => false, "error" => "File upload failed!"]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Invalid request"]);
}
?>
