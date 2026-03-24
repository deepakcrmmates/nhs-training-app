public class TinyURLShortenerQueueable implements Queueable, Database.AllowsCallouts {
    private String longUrl;
    private String emailAddress;

    public TinyURLShortenerQueueable(String longUrl, String emailAddress) {
        this.longUrl = longUrl;
        this.emailAddress = emailAddress;
    }

    public void execute(QueueableContext context) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('http://tinyurl.com/api-create.php?url=' + EncodingUtil.urlEncode(longUrl, 'UTF-8'));
        req.setMethod('GET');
        
        Http http = new Http();
        HttpResponse res = http.send(req);
        
        if (res.getStatusCode() == 200) {
            String shortUrl = res.getBody();
            System.debug('Shortened URL: ' + shortUrl);
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setToAddresses(new String[] {emailAddress});
            mail.setSubject('Submit Your Form');
            mail.setHtmlBody('<p>Dear Agent,<br/>Please click the below link to submit the form.</p>' +
                             '<p>URL: <a href="' + shortUrl + '" target="_blank">' + shortUrl + '</a></p>' +
                             '<p>Thanks,<br/>NHS Solution</p>');
            try {
                Messaging.sendEmail(new Messaging.SingleEmailMessage[] {mail});
                System.debug('Email sent successfully to ' + emailAddress);
            } catch (Exception e) {
                System.debug('Error sending email: ' + e.getMessage());
            }
        } else {
            System.debug('Error response from TinyURL: ' + res.getBody());
        }
    }
}