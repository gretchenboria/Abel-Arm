use anyhow::{Context, Result};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Sample, SizedSample, FromSample};
use std::sync::{Arc, Mutex};

/// Records audio from the default input device for the specified duration
pub async fn record_audio(duration_secs: u64) -> Result<Vec<u8>> {
    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .context("No input device available")?;

    let config = device
        .default_input_config()
        .context("Failed to get default input config")?;

    // Store samples in a thread-safe buffer
    let samples: Arc<Mutex<Vec<f32>>> = Arc::new(Mutex::new(Vec::new()));
    let samples_clone = Arc::clone(&samples);

    // Build the input stream
    let sample_format = config.sample_format();
    let stream_config: cpal::StreamConfig = config.clone().into();
    let stream = match sample_format {
        cpal::SampleFormat::F32 => build_stream::<f32>(&device, &stream_config, samples_clone)?,
        cpal::SampleFormat::I16 => build_stream::<i16>(&device, &stream_config, samples_clone)?,
        cpal::SampleFormat::U16 => build_stream::<u16>(&device, &stream_config, samples_clone)?,
        _ => anyhow::bail!("Unsupported sample format"),
    };

    stream.play()?;

    // Record for specified duration
    tokio::time::sleep(tokio::time::Duration::from_secs(duration_secs)).await;

    drop(stream);

    // Convert samples to WAV format
    let samples = samples.lock().unwrap();
    let wav_data = samples_to_wav(&samples, config.sample_rate().0)?;

    Ok(wav_data)
}

fn build_stream<T>(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    samples: Arc<Mutex<Vec<f32>>>,
) -> Result<cpal::Stream>
where
    T: Sample + SizedSample,
    f32: FromSample<T>,
{
    let err_fn = |err| eprintln!("Stream error: {}", err);

    let stream = device.build_input_stream(
        config,
        move |data: &[T], _: &cpal::InputCallbackInfo| {
            let mut samples = samples.lock().unwrap();
            for &sample in data {
                samples.push(sample.to_sample::<f32>());
            }
        },
        err_fn,
        None,
    )?;

    Ok(stream)
}

fn samples_to_wav(samples: &[f32], sample_rate: u32) -> Result<Vec<u8>> {
    let spec = hound::WavSpec {
        channels: 1,
        sample_rate,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };

    let mut cursor = std::io::Cursor::new(Vec::new());
    {
        let mut writer = hound::WavWriter::new(&mut cursor, spec)?;
        for &sample in samples {
            let amplitude = (sample * i16::MAX as f32) as i16;
            writer.write_sample(amplitude)?;
        }
        writer.finalize()?;
    }

    Ok(cursor.into_inner())
}
