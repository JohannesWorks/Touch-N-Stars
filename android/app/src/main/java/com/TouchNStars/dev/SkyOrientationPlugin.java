package com.TouchNStars.dev;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.view.Display;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SkyOrientation")
public class SkyOrientationPlugin extends Plugin implements SensorEventListener {
    private SensorManager manager;
    private boolean running = false;
    private long lastSampleNs = 0;

    private Sensor orientationSensor() {
        manager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        Sensor sensor = manager == null ? null : manager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
        if (sensor == null && manager != null)
            sensor = manager.getDefaultSensor(Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR);
        return sensor;
    }

    @PluginMethod
    public void getAvailability(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", orientationSensor() != null);
        call.resolve(result);
    }

    @PluginMethod
    public void start(PluginCall call) {
        stopSensors();
        Sensor sensor = orientationSensor();
        if (sensor == null) {
            call.reject("A north-referenced orientation sensor is unavailable", "UNAVAILABLE");
            return;
        }
        // 50 Hz stays below Android's high-rate sensor permission threshold.
        running = manager.registerListener(this, sensor, 20000);
        if (!running) {
            call.reject("Unable to start orientation sensors", "UNAVAILABLE");
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        stopSensors();
        call.resolve();
    }

    private void stopSensors() {
        running = false;
        lastSampleNs = 0;
        if (manager != null) manager.unregisterListener(this);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (!running || event.timestamp - lastSampleNs < 19000000) return;
        lastSampleNs = event.timestamp;
        float[] matrix = new float[9];
        // Android R maps device (+X right,+Y top,+Z display-out) into ENU.
        SensorManager.getRotationMatrixFromVector(matrix, event.values);
        JSArray values = new JSArray();
        for (float value : matrix) {
            if (Float.isNaN(value) || Float.isInfinite(value)) return;
            values.put((Object) Double.valueOf(value));
        }
        JSObject sample = new JSObject();
        sample.put("matrix", values);
        sample.put("reference", "magnetic");
        sample.put("lowAccuracy", event.accuracy <= SensorManager.SENSOR_STATUS_ACCURACY_LOW);
        Display display = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
            ? getActivity().getDisplay() : getActivity().getWindowManager().getDefaultDisplay();
        sample.put("screenAngleDeg", display == null ? 0 : display.getRotation() * 90);
        notifyListeners("orientation", sample);
    }

    @Override public void onAccuracyChanged(Sensor sensor, int accuracy) {}
    @Override protected void handleOnPause() { stopSensors(); }
    @Override protected void handleOnDestroy() { stopSensors(); }
}
