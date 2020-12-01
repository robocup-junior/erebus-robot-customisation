package app.tutorialspoint.com.notifyme ;
import android.app.AlarmManager ;
import android.app.DatePickerDialog ;
import android.app.Notification ;
import android.app.PendingIntent ;
import android.content.Context ;
import android.content.Intent ;
import android.os.Bundle ;
import android.support.v4.app.NotificationCompat ;
import android.support.v7.app.AppCompatActivity ;
import android.view.View ;
import android.widget.Button ;
import android.widget.DatePicker ;
import java.text.SimpleDateFormat ;
import java.util.Calendar ;
import java.util.Date ;
import java.util.Locale ;
public class MainActivity extends AppCompatActivity {
   public static final String NOTIFICATION_CHANNEL_ID = "10001" ;
   private final static String default_notification_channel_id = "default" ;
   Button btnDate ;
   final Calendar myCalendar = Calendar. getInstance () ;
   @Override
   protected void onCreate (Bundle savedInstanceState) {
      super.onCreate(savedInstanceState) ;
      setContentView(R.layout. activity_main ) ;
      btnDate = findViewById(R.id. btnDate ) ;
   }
   private void scheduleNotification (Notification notification , long delay) {
      Intent notificationIntent = new Intent(this, MyNotificationPublisher.class ) ;
      notificationIntent.putExtra(MyNotificationPublisher. NOTIFICATION_ID , 1 ) ;
      notificationIntent.putExtra(MyNotificationPublisher. NOTIFICATION , notification) ;
      PendingIntent pendingIntent = PendingIntent. getBroadcast ( this, 0 , notificationIntent , PendingIntent. FLAG_UPDATE_CURRENT ) ;
      AlarmManager alarmManager = (AlarmManager) getSystemService(Context. ALARM_SERVICE ) ;
      assert alarmManager != null;
      alarmManager.set(AlarmManager. ELAPSED_REALTIME_WAKEUP , delay , pendingIntent) ;
   }
   private Notification getNotification (String content) {
      NotificationCompat.Builder builder = new NotificationCompat.Builder( this, default_notification_channel_id ) ;
      builder.setContentTitle( "Scheduled Notification" ) ;
      builder.setContentText(content) ;
      builder.setSmallIcon(R.drawable. ic_launcher_foreground ) ;
      builder.setAutoCancel( true ) ;
      builder.setChannelId( NOTIFICATION_CHANNEL_ID ) ;
      return builder.build() ;
   }
   DatePickerDialog.OnDateSetListener date = new DatePickerDialog.OnDateSetListener() {
      @Override
      public void onDateSet (DatePicker view , int year , int monthOfYear , int dayOfMonth) {
         myCalendar .set(Calendar. YEAR , year) ;
         myCalendar .set(Calendar. MONTH , monthOfYear) ;
         myCalendar .set(Calendar. DAY_OF_MONTH , dayOfMonth) ;
         updateLabel() ;
      }
   } ;
   public void setDate (View view) {
      new DatePickerDialog(
         MainActivity. this, date ,
         myCalendar .get(Calendar. YEAR ) ,
         myCalendar .get(Calendar. MONTH ) ,
         myCalendar .get(Calendar. DAY_OF_MONTH )
      ).show() ;
   }
   private void updateLabel () {
      String myFormat = "dd/MM/yy" ; //In which you need put here
      SimpleDateFormat sdf = new SimpleDateFormat(myFormat , Locale. getDefault ()) ;
      Date date = myCalendar .getTime() ;
      btnDate .setText(sdf.format(date)) ;
      scheduleNotification(getNotification( btnDate .getText().toString()) , date.getTime()) ;
   }
}