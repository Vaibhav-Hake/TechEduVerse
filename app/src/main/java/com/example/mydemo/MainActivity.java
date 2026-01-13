package com.example.mydemo;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.gson.Gson;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.content.pm.PackageManager;
import java.util.Map;
import androidx.annotation.NonNull;
import android.content.Context;
import java.util.HashSet;
import java.util.Set;
import android.content.SharedPreferences;


import java.util.HashMap;
import java.util.Iterator;
import java.util.UUID;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.PhoneAuthCredential;
import com.google.firebase.auth.PhoneAuthOptions;
import com.google.firebase.auth.PhoneAuthProvider;
import com.google.firebase.FirebaseException;

import java.util.concurrent.TimeUnit;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.UploadTask;
import org.json.JSONObject;
import org.json.JSONArray;




public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private static final int FILE_CHOOSER_REQUEST_CODE = 100;
    private static final String TAG = "MainActivity";

    // ✅ Keep these global for all roles
    private String currentRole = "";
    private String currentUserId = "";
    private FirebaseAuth mAuth;
    private String verificationId = "";


    public class AndroidBridge {


            private Context context;
            private WebView webView;

            public AndroidBridge(Context context, WebView webView) {
                this.context = context;
                this.webView = webView;
            }

            /* ================= TRAINEE ID ================= */

            private String getTraineeId() {
                SharedPreferences prefs =
                        context.getSharedPreferences("MyAppPrefs", Context.MODE_PRIVATE);

                return prefs.getString("uuid", null); // must be saved at login
            }

            /* ================= ENROLL BATCH ================= */

            @JavascriptInterface
            public void enrollBatch(String batchJson) {
                try {
                    String traineeId = getTraineeId();
                    if (traineeId == null) return;

                    JSONObject batch = new JSONObject(batchJson);
                    String batchId = batch.getString("batchId");

                    Map<String, Object> batchMap = new HashMap<>();
                    batchMap.put("batchId", batch.getString("batchId"));
                    batchMap.put("batchName", batch.getString("batchName"));
                    batchMap.put("subject", batch.getString("subject"));
                    batchMap.put("time", batch.getString("time"));
                    batchMap.put("trainerId", batch.getString("trainerId"));

                    FirebaseDatabase.getInstance()
                            .getReference("enrollments")
                            .child(traineeId)
                            .child(batchId)
                            .setValue(batchMap)
                            .addOnSuccessListener(unused ->
                                    webView.post(() ->
                                            webView.evaluateJavascript(
                                                    "onBatchEnrolled()", null
                                            )
                                    )
                            );

                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            /* ================= GET ENROLLED BATCHES ================= */

            @JavascriptInterface
            public void getEnrolledBatches() {
                String traineeId = getTraineeId();
                if (traineeId == null) return;

                FirebaseDatabase.getInstance()
                        .getReference("enrollments")
                        .child(traineeId)
                        .addListenerForSingleValueEvent(new ValueEventListener() {

                            @Override
                            public void onDataChange(@NonNull DataSnapshot snapshot) {
                                JSONArray arr = new JSONArray();

                                for (DataSnapshot snap : snapshot.getChildren()) {
                                    try {
                                        JSONObject obj = new JSONObject();
                                        for (DataSnapshot field : snap.getChildren()) {
                                            obj.put(field.getKey(), field.getValue());
                                        }
                                        arr.put(obj);
                                    } catch (Exception ignored) {}
                                }

                                webView.post(() ->
                                        webView.evaluateJavascript(
                                                "showBatchesFromFirebase(" + arr + ")", null
                                        )
                                );
                            }

                            @Override
                            public void onCancelled(@NonNull DatabaseError error) {}
                        });
            }

            /* ================= FILTER HOME BATCHES ================= */

        @JavascriptInterface
        public void filterHomeBatches(String allBatchesJson) {
            String traineeId = getTraineeId();
            if (traineeId == null || traineeId.isEmpty()) {
                webView.post(() ->
                        webView.evaluateJavascript("showFilteredHomeBatches([])", null)
                );
                return;
            }

            DatabaseReference enrollRef = FirebaseDatabase.getInstance()
                    .getReference("enrollments")
                    .child(traineeId);

            enrollRef.addListenerForSingleValueEvent(new ValueEventListener() {
                @Override
                public void onDataChange(@NonNull DataSnapshot snapshot) {
                    try {
                        JSONArray all = new JSONArray(allBatchesJson);
                        JSONArray result = new JSONArray();

                        Set<String> enrolledIds = new HashSet<>();
                        for (DataSnapshot s : snapshot.getChildren()) {
                            enrolledIds.add(s.getKey());
                        }

                        for (int i = 0; i < all.length(); i++) {
                            JSONObject b = all.getJSONObject(i);
                            String batchId = b.getString("batchId");
                            if (!enrolledIds.contains(batchId)) {
                                result.put(b);
                            }
                        }

                        String safeJson = JSONObject.quote(result.toString());
                        webView.post(() ->
                                webView.evaluateJavascript(
                                        "showFilteredHomeBatches(" + safeJson + ")", null
                                )
                        );

                    } catch (Exception e) {
                        e.printStackTrace();
                        webView.post(() ->
                                webView.evaluateJavascript("showFilteredHomeBatches([])", null)
                        );
                    }
                }

                @Override
                public void onCancelled(@NonNull DatabaseError error) {
                    webView.post(() ->
                            webView.evaluateJavascript("showFilteredHomeBatches([])", null)
                    );
                }
            });
        }




        @JavascriptInterface
        public void getStudentsByBatch(String batchId) {
            DatabaseReference ref = FirebaseDatabase.getInstance()
                    .getReference("users/trainee");

            ref.orderByChild("batchId").equalTo(batchId)
                    .get().addOnSuccessListener(snapshot -> {
                        JSONObject enrolledStudents = new JSONObject();

                        for (DataSnapshot s : snapshot.getChildren()) {
                            try {
                                JSONObject studentData = new JSONObject();
                                studentData.put("traineeFullName", s.child("traineeName").getValue(String.class));
                                studentData.put("traineeEmail", s.child("traineeEmail").getValue(String.class));
                                studentData.put("traineeId", s.getKey());

                                enrolledStudents.put(s.getKey(), studentData);
                            } catch (Exception e) {
                                Log.e("GET_STUDENTS", e.getMessage());
                            }
                        }

                        String safeJson = JSONObject.quote(enrolledStudents.toString());

                        runOnUiThread(() ->
                                webView.evaluateJavascript("displayEnrolledStudents(" + safeJson + ")", null)
                        );
                    }).addOnFailureListener(e -> {
                        Log.e("GET_STUDENTS", e.getMessage());
                    });
        }


        @JavascriptInterface
        public void getTrainerAssignedBatches(String trainerId){
            DatabaseReference ref = FirebaseDatabase.getInstance()
                    .getReference("trainerAssigned")
                    .child(trainerId);

            ref.get().addOnSuccessListener(snapshot -> {
                JSONObject obj = new JSONObject();

                for(DataSnapshot s : snapshot.getChildren()){
                    try {
                        obj.put(s.getKey(), s.getValue());
                    } catch (Exception ignored){}
                }

                webView.evaluateJavascript(
                        "showTrainerAssignedBatches('"+ obj.toString() +"')",
                        null
                );
            });
        }

        @JavascriptInterface
        public void getAllTrainersForManagement(){
            DatabaseReference ref = FirebaseDatabase.getInstance(
                    "https://mydemofirebase-b58cd-default-rtdb.firebaseio.com/"
            ).getReference("users/trainer");

            ref.get().addOnSuccessListener(snapshot -> {
                try{
                    JSONObject obj = new JSONObject();

                    for(DataSnapshot s : snapshot.getChildren()){
                        JSONObject t = new JSONObject();

                        // ✅ KEYS MATCH JS
                        t.put("tFullName", s.child("tFullName").getValue(String.class));
                        t.put("tEmail", s.child("tEmail").getValue(String.class));

                        obj.put(s.getKey(), t);
                    }

                    // ✅ SAFE JSON
                    String safeJson = JSONObject.quote(obj.toString());

                    webView.evaluateJavascript(
                            "displayTrainerCards(" + safeJson + ")",
                            null
                    );

                } catch (Exception e){
                    e.printStackTrace();
                }
            });
        }

        @JavascriptInterface
        public void getSpecificTrainer(String trainerId){
            DatabaseReference ref = FirebaseDatabase.getInstance(
                    "https://mydemofirebase-b58cd-default-rtdb.firebaseio.com/"
            ).getReference("users/trainer").child(trainerId);

            ref.get().addOnSuccessListener(snapshot -> {
                if(snapshot.exists()){
                    try {
                        Map<String,Object> map =
                                (Map<String,Object>) snapshot.getValue();

                        JSONObject jsonObject = new JSONObject(map);

                        // ✅ IMPORTANT LINE (THIS WAS MISSING)
                        String safeJson = JSONObject.quote(jsonObject.toString());

                        webView.evaluateJavascript(
                                "displayTrainerProfile(" + safeJson + ");",
                                null
                        );

                    } catch (Exception e) {
                        Log.e("TRAINER_PROFILE", e.getMessage());
                    }
                }
            });
        }


        @JavascriptInterface
        public void getSpecificStudent(String studentId) {
            DatabaseReference ref = FirebaseDatabase.getInstance(
                    "https://mydemofirebase-b58cd-default-rtdb.firebaseio.com/"
            ).getReference("users/trainee").child(studentId);

            ref.get().addOnSuccessListener(snapshot -> {
                if(snapshot.exists()){
                    try {
                        JSONObject obj = new JSONObject();

                        for (DataSnapshot s : snapshot.getChildren()) {
                            obj.put(s.getKey(), s.getValue());
                        }

                        String safeJson = JSONObject.quote(obj.toString());

                        webView.evaluateJavascript(
                                "showStudentFullProfile(" + safeJson + ");",
                                null
                        );
                    } catch (Exception e) {
                        Log.e("STUDENT_PROFILE", e.getMessage());
                    }
                }
            });
        }



        @JavascriptInterface
        public void getAllBatches() {
            DatabaseReference ref = FirebaseDatabase.getInstance(
                    "https://mydemofirebase-b58cd-default-rtdb.firebaseio.com/"
            ).getReference("batches");

            ref.get().addOnSuccessListener(snapshot -> {
                JSONArray arr = new JSONArray();
                for(DataSnapshot snap : snapshot.getChildren()){
                    try{
                        String id = snap.getKey();
                        String raw = snap.getValue(String.class);
                        JSONObject batchObj = new JSONObject(raw);
                        batchObj.put("batchId", id);
                        arr.put(batchObj);
                    } catch (Exception ignored){}
                }
                String safe = JSONObject.quote(arr.toString());
                webView.evaluateJavascript("showBatchCards("+safe+");", null);
            });
        }
        @JavascriptInterface
        public void deleteBatch(String batchId){
            FirebaseDatabase db = FirebaseDatabase.getInstance(
                    "https://mydemofirebase-b58cd-default-rtdb.firebaseio.com/"
            );

            db.getReference("batches").child(batchId).removeValue();
            Toast.makeText(MainActivity.this, "Batch Deleted", Toast.LENGTH_SHORT).show();
        }
        @JavascriptInterface
        public void getAllTrainersForChat(){
            DatabaseReference ref = FirebaseDatabase.getInstance().getReference("users/trainer");
            ref.get().addOnCompleteListener(task -> {
                if(task.isSuccessful()){
                    JSONObject obj = new JSONObject();
                    task.getResult().getChildren().forEach(snap -> {
                        try {
                            obj.put(snap.getKey(), new JSONObject(new Gson().toJson(snap.getValue())));
                        } catch (Exception e){}
                    });
                    webView.evaluateJavascript("loadTrainerList('"+obj.toString()+"')",null);
                }
            });
        }
        @JavascriptInterface
        public void getChatHistory(String partnerId){
            FirebaseUser u = FirebaseAuth.getInstance().getCurrentUser();
            String myId = u.getUid();

            DatabaseReference ref = FirebaseDatabase.getInstance()
                    .getReference("chats").child(myId).child(partnerId);

            ref.get().addOnCompleteListener(t -> {
                if(t.isSuccessful()){
                    webView.evaluateJavascript("showChatMessages('"+ new Gson().toJson(t.getResult().getValue()) +"')",null);
                }
            });
        }
//        @JavascriptInterface
//        public void sendPersonalMessage(String partnerId, String text, String sender){
//            FirebaseUser u = FirebaseAuth.getInstance().getCurrentUser();
//            String myId = u.getUid();
//
//            MessageModel msg = new MessageModel(sender, text, System.currentTimeMillis());
//
//            FirebaseDatabase.getInstance()
//                    .getReference("chats").child(myId).child(partnerId)
//                    .push().setValue(msg);
//
//            FirebaseDatabase.getInstance()
//                    .getReference("chats").child(partnerId).child(myId)
//                    .push().setValue(msg);
//        }
        @JavascriptInterface
        public void getGroupMessages(String batchId){
            DatabaseReference ref = FirebaseDatabase.getInstance()
                    .getReference("batchChats")
                    .child(batchId);

            ref.addValueEventListener(new ValueEventListener() {
                @Override
                public void onDataChange(DataSnapshot snapshot) {
                    JSONObject result = new JSONObject();

                    for(DataSnapshot msgSnap : snapshot.getChildren()){
                        try {
                            JSONObject msg = new JSONObject();
                            msg.put("from", msgSnap.child("from").getValue(String.class));
                            msg.put("text", msgSnap.child("text").getValue(String.class));
                            msg.put("timestamp", msgSnap.child("timestamp").getValue(Long.class));

                            result.put(msgSnap.getKey(), msg);
                        } catch (Exception e){
                            Log.e("GROUP_CHAT", e.getMessage());
                        }
                    }

                    String safe = JSONObject.quote(result.toString());
                    webView.evaluateJavascript(
                            "loadGroupMessages("+safe+");",
                            null
                    );
                }

                @Override
                public void onCancelled(DatabaseError error) {}
            });
        }



        @JavascriptInterface
        public void sendGroupMessage(String batchId, String message, String senderRole){
            DatabaseReference ref = FirebaseDatabase.getInstance().getReference("batchChats").child(batchId);

            String key = ref.push().getKey();
            HashMap<String, Object> map = new HashMap<>();
            map.put("from", senderRole);
            map.put("text", message);
            map.put("timestamp", System.currentTimeMillis());

            ref.child(key).setValue(map)
                    .addOnSuccessListener(a -> Log.d("CHAT", "Message Sent"))
                    .addOnFailureListener(e -> Log.e("CHAT", "Error: "+e.getMessage()));
        }


        public class MessageModel {
            public String from, text;
            public long timestamp;

            public MessageModel(){}

            public MessageModel(String f, String t, long time){
                this.from = f;
                this.text = t;
                this.timestamp = time;
            }
        }
        @JavascriptInterface
        public void getUsersByRole(String role){
            DatabaseReference ref = FirebaseDatabase.getInstance()
                    .getReference("users").child(role);

            ref.get().addOnSuccessListener(snapshot -> {
                JSONObject obj = new JSONObject();

                for (DataSnapshot s : snapshot.getChildren()) {
                    try {
                        JSONObject u = new JSONObject();

                        if(role.equals("trainer")){
                            u.put("name", s.child("tFullName").getValue());
                            u.put("email", s.child("tEmail").getValue());
                        } else if(role.equals("trainee")){
                            u.put("name", s.child("traineeName").getValue());
                            u.put("email", s.child("traineeEmail").getValue());
                        } else if(role.equals("management")){
                            u.put("name", s.child("mFullName").getValue());
                            u.put("email", s.child("mEmail").getValue());
                        }

                        obj.put(s.getKey(), u);

                    } catch (Exception ignored){}
                }

                webView.evaluateJavascript(
                        "displayChatList('"+role+"', '"+obj.toString()+"')",
                        null
                );
            });
        }
        @JavascriptInterface
        public void getAssignedBatches(){
            String id = currentUserId;
            FirebaseDatabase.getInstance().getReference("trainerAssigned")
                    .child(id).get().addOnSuccessListener(snap -> {

                        JSONObject obj = new JSONObject();

                        snap.getChildren().forEach(batch -> {
                            try {
                                String batchId = batch.getKey();
                                FirebaseDatabase.getInstance().getReference("batches")
                                        .child(batchId).get().addOnSuccessListener(b -> {
                                            try{
                                                JSONObject data = new JSONObject(b.getValue(String.class));
                                                data.put("batchId", batchId);
                                                obj.put(batchId, data);
                                                webView.evaluateJavascript(
                                                        "showAssignedBatches('"+obj.toString()+"')", null);
                                            }catch (Exception ignored){}
                                        });
                            } catch (Exception ignored){}
                        });
                    });
        }

        @JavascriptInterface
        public void sendPersonalMessage(String receiverId, String text){
            String senderId = currentUserId;
            DatabaseReference chatRef = FirebaseDatabase.getInstance()
                    .getReference("personalChats")
                    .child(senderId)
                    .child(receiverId)
                    .push();

            chatRef.child("sender").setValue("management");
            chatRef.child("text").setValue(text);
            chatRef.child("timestamp").setValue(System.currentTimeMillis());
        }
        @JavascriptInterface
        public void getChatMessages(String otherId){
            String me = currentUserId;
            DatabaseReference ref = FirebaseDatabase.getInstance()
                    .getReference("personalChats").child(me).child(otherId);

            ref.get().addOnSuccessListener(snapshot -> {
                JSONArray arr = new JSONArray();
                for(DataSnapshot s : snapshot.getChildren()){
                    try{
                        JSONObject m = new JSONObject();
                        m.put("sender", s.child("sender").getValue(String.class));
                        m.put("text", s.child("text").getValue(String.class));
                        arr.put(m);
                    } catch(Exception ignored){}
                }
                webView.evaluateJavascript("displayChatMessages('"+arr.toString()+"')", null);
            });
        }

        @JavascriptInterface
        public void getAllStudents(){
            DatabaseReference ref = FirebaseDatabase.getInstance(
                    "https://mydemofirebase-b58cd-default-rtdb.firebaseio.com/"
            ).getReference("users/trainee");

            ref.get().addOnSuccessListener(snapshot -> {
                JSONObject stuObj = new JSONObject();
                for (DataSnapshot snap : snapshot.getChildren()) {
                    try {
                        JSONObject s = new JSONObject();
                        s.put("traineeFullName", snap.child("traineeName").getValue(String.class));
                        s.put("traineeEmail", snap.child("traineeEmail").getValue(String.class));
                        stuObj.put(snap.getKey(), s);
                    } catch (Exception ignored){}
                }
                webView.evaluateJavascript("displayStudents('"+ stuObj.toString() +"')", null);
            });
        }
        @JavascriptInterface
        public void getAllStudentsForRequirement() {
            DatabaseReference ref = FirebaseDatabase.getInstance(
                    "https://mydemofirebase-b58cd-default-rtdb.firebaseio.com/"
            ).getReference("users/trainee");

            ref.get().addOnSuccessListener(snapshot -> {
                try {
                    JSONObject stuObj = new JSONObject();

                    for (DataSnapshot snap : snapshot.getChildren()) {
                        JSONObject s = new JSONObject();

                        // ✅ MUST MATCH JS KEY
                        s.put("traineeFullName",
                                snap.child("traineeName").getValue(String.class));

                        stuObj.put(snap.getKey(), s);
                    }

                    // ✅ SAFE JSON
                    String safeJson = JSONObject.quote(stuObj.toString());

                    // ✅ IMPORTANT: call SAME JS function
                    webView.evaluateJavascript(
                            "displayStudents(" + safeJson + ");",
                            null
                    );

                } catch (Exception e) {
                    Log.e("REQ_STUDENT", e.getMessage());
                }
            });
        }

        @JavascriptInterface
        public void addBatch(String batchId, String batchJson) {
            try {
                JSONObject obj = new JSONObject(batchJson);

                // ✔️ Save batch under /batches/{batchId}
                FirebaseDatabase.getInstance(
                                "https://mydemofirebase-b58cd-default-rtdb.firebaseio.com/"
                        ).getReference("batches")
                        .child(batchId)
                        .setValue(obj.toString());

                // ✔️ Assign trainer
                String trainerId = obj.getString("trainerId");
                FirebaseDatabase.getInstance(
                                "https://mydemofirebase-b58cd-default-rtdb.firebaseio.com/"
                        ).getReference("trainerAssigned")
                        .child(trainerId)
                        .child(batchId)
                        .setValue("Assigned");

                Log.d("ADD_BATCH", "Batch saved successfully");

            } catch (Exception e) {
                Log.e("ADD_BATCH_ERROR", e.getMessage());
            }
        }

        @JavascriptInterface
        public void addRequirement(String studentId, String json) {
            try {
                JSONObject obj = new JSONObject(json);

                DatabaseReference ref = FirebaseDatabase.getInstance()
                        .getReference("requirements")
                        .child(studentId)
                        .push();

                Map<String, Object> map = new HashMap<>();
                Iterator<String> keys = obj.keys();

                while (keys.hasNext()) {
                    String key = keys.next();
                    map.put(key, obj.get(key));
                }

                // ✅ ADD SUCCESS LISTENER
                ref.setValue(map).addOnSuccessListener(aVoid -> {
                    webView.evaluateJavascript(
                            "onRequirementAdded();",
                            null
                    );
                });

            } catch (Exception e) {
                e.printStackTrace();
            }
        }



        @JavascriptInterface
        public void getStudentRequirements(String studentId){
            DatabaseReference ref = FirebaseDatabase.getInstance()
                    .getReference("requirements")
                    .child(studentId);

            ref.get().addOnSuccessListener(snap -> {
                JSONObject obj = new JSONObject();

                for(DataSnapshot s : snap.getChildren()){
                    try{
                        JSONObject r = new JSONObject();
                        r.put("company", s.child("company").getValue());
                        r.put("role", s.child("role").getValue());
                        r.put("date", s.child("date").getValue());
                        r.put("time", s.child("time").getValue());
                        r.put("description", s.child("description").getValue());
                        r.put("from", s.child("from").getValue());

                        obj.put(s.getKey(), r);
                    }catch(Exception ignored){}
                }

                // 🔐 ESCAPE JSON (VERY IMPORTANT)
                String json = obj.toString()
                        .replace("\\", "\\\\")
                        .replace("'", "\\'");

                webView.evaluateJavascript(
                        "displayRequirements('"+ json +"')",
                        null
                );
            });
        }



        @JavascriptInterface
        public void getTrainerBatches(String trainerId){
            DatabaseReference ref = FirebaseDatabase.getInstance().getReference("batches");

            ref.orderByChild("trainerId").equalTo(trainerId)
                    .addListenerForSingleValueEvent(new ValueEventListener(){
                        @Override
                        public void onDataChange(DataSnapshot snapshot){
                            JSONObject obj = new JSONObject();
                            for(DataSnapshot snap : snapshot.getChildren()){
                                try {
                                    JSONObject b = new JSONObject();
                                    b.put("batchName", snap.child("batchName").getValue());
                                    b.put("subject", snap.child("subject").getValue());
                                    b.put("time", snap.child("time").getValue());
                                    obj.put(snap.getKey(), b);
                                } catch(Exception ignored){}
                            }
                            webView.evaluateJavascript("displayTrainerBatches('"+obj.toString()+"')", null);
                        }

                        @Override public void onCancelled(DatabaseError error){}
                    });
        }
        @JavascriptInterface
        public void sendBatchMessage(String batchId, String message){
            FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
            String trainerId = (user != null) ? user.getUid() : "trainer";

            DatabaseReference chatRef = FirebaseDatabase.getInstance()
                    .getReference("messages/batchMessages/"+batchId)
                    .push();

            chatRef.child("senderId").setValue(trainerId);
            chatRef.child("message").setValue(message);
            chatRef.child("timestamp").setValue(System.currentTimeMillis());
        }

        // 📌 GET ALL TRAINERS LIST
        @JavascriptInterface
        public void getAllTrainers() {
            DatabaseReference ref = FirebaseDatabase.getInstance(
                    "https://mydemofirebase-b58cd-default-rtdb.firebaseio.com/"
            ).getReference("users/trainer");

            ref.get().addOnSuccessListener(snapshot -> {
                JSONObject trainerObj = new JSONObject();
                for (DataSnapshot snap : snapshot.getChildren()) {
                    try {
                        JSONObject t = new JSONObject();
                        t.put("tFullName", snap.child("tFullName").getValue(String.class));
                        t.put("tEmail", snap.child("tEmail").getValue(String.class));
                        trainerObj.put(snap.getKey(), t);
                    } catch (Exception ignored) {}
                }
                webView.evaluateJavascript("receiveTrainers('"+ trainerObj.toString() +"')", null);
            });
        }



        // ---------- SIGNUP / REGISTER ----------
        @JavascriptInterface
        public void uploadUserData(String userJson) {
            runOnUiThread(() -> {
                try {
                    JSONObject obj = new JSONObject(userJson);

                    currentRole = obj.optString("role", "unknown_role");
                    currentUserId = UUID.randomUUID().toString();

                    DatabaseReference ref = FirebaseDatabase.getInstance(
                                    "https://mydemofirebase-b58cd-default-rtdb.firebaseio.com/"
                            ).getReference("users")
                            .child(currentRole)
                            .child(currentUserId);

                    HashMap<String, Object> userMap = new HashMap<>();
                    Iterator<String> keys = obj.keys();

                    while (keys.hasNext()) {
                        String key = keys.next();
                        Object value = obj.get(key);

                        // ✅ store everything as primitive/string
                        if (value instanceof JSONObject || value instanceof JSONArray) {
                            userMap.put(key, value.toString());
                        } else {
                            userMap.put(key, obj.optString(key, ""));
                        }
                    }

                    userMap.put("uuid", currentUserId);

                    // ✅ STEP 1: SAVE USER DATA (NO IMAGE)
                    ref.setValue(userMap).addOnSuccessListener(aVoid -> {

                        // ✅ STEP 2: UPLOAD IMAGE IF EXISTS
                        if (obj.has("traineePhotoUri") &&
                                !obj.optString("traineePhotoUri").isEmpty()) {

                            Uri imageUri = Uri.parse(obj.optString("traineePhotoUri"));

                            FirebaseStorage storage = FirebaseStorage.getInstance();
                            StorageReference storageRef = storage.getReference()
                                    .child("profile_photos")
                                    .child(currentUserId + ".jpg");

                            storageRef.putFile(imageUri)
                                    .continueWithTask(task -> storageRef.getDownloadUrl())
                                    .addOnSuccessListener(uri -> {
                                        // ✅ SAVE ONLY URL STRING
                                        ref.child("traineePhoto").setValue(uri.toString());
                                    });
                        }

                        Toast.makeText(
                                MainActivity.this,
                                "User registered successfully (" + currentRole + ")",
                                Toast.LENGTH_SHORT
                        ).show();
                    });

                } catch (Exception e) {
                    Log.e("UPLOAD_ERROR", e.getMessage(), e);
                    Toast.makeText(
                            MainActivity.this,
                            "Error during upload",
                            Toast.LENGTH_SHORT
                    ).show();
                }
            });
        }



        // ---------- LOGIN ----------
        @JavascriptInterface
        public void loginUser(String loginJson) {
            runOnUiThread(() -> {
                try {
                    org.json.JSONObject obj = new org.json.JSONObject(loginJson);
                    String role = obj.getString("role");
                    String username = obj.getString("username");
                    String password = obj.getString("password");

                    DatabaseReference ref = FirebaseDatabase.getInstance(
                            "https://mydemofirebase-b58cd-default-rtdb.firebaseio.com/"
                    ).getReference("users").child(role);

                    ref.get().addOnSuccessListener(snapshot -> {
                        boolean found = false;

                        for (DataSnapshot userSnap : snapshot.getChildren()) {
                            String dbUsername = null;
                            String dbPassword = null;

                            if (role.equalsIgnoreCase("trainer")) {
                                dbUsername = userSnap.child("tUsername").getValue(String.class);
                                dbPassword = userSnap.child("tPassword").getValue(String.class);
                            } else if (role.equalsIgnoreCase("management")) {
                                dbUsername = userSnap.child("mUsername").getValue(String.class);
                                dbPassword = userSnap.child("mPassword").getValue(String.class);
                            } else if (role.equalsIgnoreCase("trainee")) {
                                dbUsername = userSnap.child("traineeUsername").getValue(String.class);
                                dbPassword = userSnap.child("traineePassword").getValue(String.class);
                            }

                            if (username.equals(dbUsername) && password.equals(dbPassword)) {
                                found = true;
                                currentUserId = userSnap.getKey(); // ✅ Save UUID
                                currentRole = role; // ✅ Remember current role
                                break;
                            }
                        }

                        if (found) {
                            Toast.makeText(MainActivity.this, "Login successful.", Toast.LENGTH_SHORT).show();

                            // ⚡ Save UUID in localStorage inside WebView
                            webView.evaluateJavascript("localStorage.setItem('uuid', '"+ currentUserId +"');", null);
                            // ✅ ALSO SAVE UUID FOR ANDROID BRIDGE (VERY IMPORTANT)
                            SharedPreferences prefs =
                                    getSharedPreferences("MyAppPrefs", MODE_PRIVATE);

                            prefs.edit()
                                    .putString("uuid", currentUserId)
                                    .apply();

                            // Load separate dashboard for each role
                            String pageUrl = "file:///android_asset/dashbord.html";
                            if (role.equalsIgnoreCase("trainer")) {
                                pageUrl = "file:///android_asset/trainer_dashbord.html";
                            } else if (role.equalsIgnoreCase("management")) {
                                pageUrl = "file:///android_asset/managment_dashbord.html";
                            } else if (role.equalsIgnoreCase("trainee")) {
                                pageUrl = "file:///android_asset/trainee_dashbord.html";
                            }

                            webView.loadUrl(pageUrl);
                        }

                        else {
                            Toast.makeText(MainActivity.this, "Invalid username or password.", Toast.LENGTH_SHORT).show();
                            webView.evaluateJavascript("onLoginFailed();", null);
                        }

                    }).addOnFailureListener(e ->
                            Toast.makeText(MainActivity.this, "Database connection failed.", Toast.LENGTH_SHORT).show()
                    );

                } catch (Exception e) {
                    Log.e(TAG, "loginUser error", e);
                    Toast.makeText(MainActivity.this, "Login process failed.", Toast.LENGTH_SHORT).show();
                }
            });
        }

        // ---------- RESET PASSWORD ----------
        @JavascriptInterface
        public void resetPassword(String resetJson) {
            runOnUiThread(() -> {
                try {
                    org.json.JSONObject obj = new org.json.JSONObject(resetJson);
                    String role = obj.getString("role");
                    String username = obj.getString("username");
                    String newPassword = obj.getString("newPassword");

                    DatabaseReference ref = FirebaseDatabase.getInstance(
                            "https://mydemofirebase-b58cd-default-rtdb.firebaseio.com/"
                    ).getReference("users").child(role);

                    ref.get().addOnSuccessListener(snapshot -> {
                        boolean updated = false;

                        for (DataSnapshot userSnap : snapshot.getChildren()) {
                            String dbUsername = null;
                            String passwordKey = null;

                            if (userSnap.child("username").exists()) {
                                dbUsername = userSnap.child("username").getValue(String.class);
                                passwordKey = "password";
                            } else if (userSnap.child("traineeUsername").exists()) {
                                dbUsername = userSnap.child("traineeUsername").getValue(String.class);
                                passwordKey = "traineePassword";
                            } else if (userSnap.child("tUsername").exists()) {
                                dbUsername = userSnap.child("tUsername").getValue(String.class);
                                passwordKey = "tPassword";
                            } else if (userSnap.child("mUsername").exists()) {
                                dbUsername = userSnap.child("mUsername").getValue(String.class);
                                passwordKey = "mPassword";
                            }

                            if (dbUsername != null && username.equals(dbUsername)) {
                                if (passwordKey != null) {
                                    userSnap.getRef().child(passwordKey).setValue(newPassword)
                                            .addOnSuccessListener(aVoid -> {
                                                Toast.makeText(MainActivity.this,
                                                        "Password updated successfully!", Toast.LENGTH_SHORT).show();
                                                webView.evaluateJavascript("onPasswordResetSuccess();", null);
                                            })
                                            .addOnFailureListener(e -> {
                                                Toast.makeText(MainActivity.this,
                                                        "Failed to update password: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                                                webView.evaluateJavascript("onPasswordResetFailed();", null);
                                            });
                                    updated = true;
                                }
                                break;
                            }
                        }

                        if (!updated) {
                            Toast.makeText(MainActivity.this, "Username not found in " + role + "!", Toast.LENGTH_SHORT).show();
                            webView.evaluateJavascript("onPasswordResetFailed();", null);
                        }

                    }).addOnFailureListener(e -> {
                        Toast.makeText(MainActivity.this, "Database connection failed!", Toast.LENGTH_SHORT).show();
                        webView.evaluateJavascript("onPasswordResetFailed();", null);
                    });

                } catch (Exception e) {
                    Log.e(TAG, "resetPassword error", e);
                    Toast.makeText(MainActivity.this, "Error during password reset.", Toast.LENGTH_SHORT).show();
                    webView.evaluateJavascript("onPasswordResetFailed();", null);
                }
            });
        }

        // ---------- GET PROFILE ----------
        @JavascriptInterface
        public void getUserProfile(String role) {
            runOnUiThread(() -> {
                DatabaseReference ref = FirebaseDatabase.getInstance(
                        "https://mydemofirebase-b58cd-default-rtdb.firebaseio.com/"
                ).getReference("users").child(role).child(currentUserId);

                ref.get().addOnSuccessListener(snapshot -> {
                    if (snapshot.exists()) {
                        try {
                            Map<String,Object> map = (Map<String,Object>) snapshot.getValue();
                            org.json.JSONObject jsonObject = new org.json.JSONObject(map);
                            String safeJson = org.json.JSONObject.quote(jsonObject.toString()); // ✅ safely escape JSON
                            webView.evaluateJavascript("showProfileDetails(" + safeJson + ");", null);
                        } catch (Exception e) {
                            Log.e(TAG, "JSON parse error: " + e.getMessage());
                        }
                    } else {
                        Toast.makeText(MainActivity.this, "Profile not found!", Toast.LENGTH_SHORT).show();
                    }
                }).addOnFailureListener(e -> Toast.makeText(MainActivity.this, "Failed to fetch profile: " + e.getMessage(), Toast.LENGTH_SHORT).show());
            });
        }

        @JavascriptInterface
        public void sendOtp(String json) {
            runOnUiThread(() -> {
                try {
                    org.json.JSONObject obj = new org.json.JSONObject(json);
                    String mobile = obj.getString("mobile"); // +91XXXXXXXXXX

                    PhoneAuthOptions options =
                            PhoneAuthOptions.newBuilder(mAuth)
                                    .setPhoneNumber(mobile)
                                    .setTimeout(60L, TimeUnit.SECONDS)
                                    .setActivity(MainActivity.this)
                                    .setCallbacks(new PhoneAuthProvider.OnVerificationStateChangedCallbacks() {

                                        @Override
                                        public void onCodeSent(String id,
                                                               PhoneAuthProvider.ForceResendingToken token) {
                                            verificationId = id;
                                            webView.evaluateJavascript("onOtpSent();", null);
                                        }

                                        @Override
                                        public void onVerificationCompleted(PhoneAuthCredential credential) {
                                            // Auto verification (optional)
                                        }

                                        @Override
                                        public void onVerificationFailed(FirebaseException e) {
                                            Log.e("OTP", e.getMessage());
                                            webView.evaluateJavascript("onOtpFailed();", null);
                                        }
                                    })
                                    .build();

                    PhoneAuthProvider.verifyPhoneNumber(options);

                } catch (Exception e) {
                    Log.e("SEND_OTP", e.getMessage());
                }
            });
        }
        @JavascriptInterface
        public void verifyOtp(String otp) {
            runOnUiThread(() -> {
                try {
                    PhoneAuthCredential credential =
                            PhoneAuthProvider.getCredential(verificationId, otp);

                    mAuth.signInWithCredential(credential)
                            .addOnSuccessListener(authResult ->
                                    webView.evaluateJavascript("onOtpVerified();", null)
                            )
                            .addOnFailureListener(e ->
                                    webView.evaluateJavascript("onOtpInvalid();", null)
                            );

                } catch (Exception e) {
                    Log.e("VERIFY_OTP", e.getMessage());
                }
            });
        }
        @JavascriptInterface
        public void updatePassword(String json) {
            runOnUiThread(() -> {
                try {
                    org.json.JSONObject obj = new org.json.JSONObject(json);
                    String role = obj.getString("role");
                    String username = obj.getString("username");
                    String newPassword = obj.getString("newPassword");

                    DatabaseReference ref = FirebaseDatabase.getInstance(
                            "https://mydemofirebase-b58cd-default-rtdb.firebaseio.com/"
                    ).getReference("users").child(role);

                    ref.get().addOnSuccessListener(snapshot -> {
                        for (DataSnapshot userSnap : snapshot.getChildren()) {

                            String dbUser = null;
                            String passwordKey = null;

                            if (userSnap.child("traineeUsername").exists()) {
                                dbUser = userSnap.child("traineeUsername").getValue(String.class);
                                passwordKey = "traineePassword";
                            } else if (userSnap.child("tUsername").exists()) {
                                dbUser = userSnap.child("tUsername").getValue(String.class);
                                passwordKey = "tPassword";
                            } else if (userSnap.child("mUsername").exists()) {
                                dbUser = userSnap.child("mUsername").getValue(String.class);
                                passwordKey = "mPassword";
                            }

                            if (dbUser != null && dbUser.equals(username)) {
                                userSnap.getRef().child(passwordKey).setValue(newPassword);
                                webView.evaluateJavascript("onPasswordResetSuccess();", null);
                                return;
                            }
                        }
                        webView.evaluateJavascript("onPasswordResetFailed();", null);
                    });

                } catch (Exception e) {
                    webView.evaluateJavascript("onPasswordResetFailed();", null);
                }
            });
        }


    }

    // ------------------------- LIFECYCLE -------------------------
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        mAuth = FirebaseAuth.getInstance();


        webView = findViewById(R.id.webview);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        if (checkSelfPermission(android.Manifest.permission.READ_EXTERNAL_STORAGE)
                != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{android.Manifest.permission.READ_EXTERNAL_STORAGE}, 1);
        }

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST_CODE);
                } catch (Exception e) {
                    MainActivity.this.filePathCallback = null;
                    Toast.makeText(MainActivity.this, "Unable to open file chooser.", Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }
        });

        webView.addJavascriptInterface(new AndroidBridge(this, webView), "AndroidBridge");

        webView.loadUrl("file:///android_asset/index1.html");

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true)
        { @Override
        public void handleOnBackPressed()
        {
            if (webView.canGoBack()) webView.goBack();
            else finish(); }
        });



    }

    // -------------------- FILE UPLOAD --------------------
    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (filePathCallback == null) return;

        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            Uri[] result = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                Uri uri = data.getData();
                if (uri != null) {
                    result = new Uri[]{uri};
                }
            }
            filePathCallback.onReceiveValue(result);
            filePathCallback = null;
        }
    }
}
