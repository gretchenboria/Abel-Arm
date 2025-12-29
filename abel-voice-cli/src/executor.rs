use anyhow::{Context, Result};
use std::path::Path;
use std::process::Command;

/// Execute a Python script in a virtual environment
pub async fn run_script(script_path: &Path) -> Result<String> {
    // Ensure venv exists
    let venv_path = get_or_create_venv().await?;

    // Determine python executable in venv
    let python_exe = if cfg!(windows) {
        venv_path.join("Scripts").join("python.exe")
    } else {
        venv_path.join("bin").join("python")
    };

    // Execute the script
    let output = Command::new(&python_exe)
        .arg(script_path)
        .output()
        .context("Failed to execute Python script")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Script execution failed:\n{}", stderr);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout.to_string())
}

async fn get_or_create_venv() -> Result<std::path::PathBuf> {
    let home = dirs::home_dir().context("Could not find home directory")?;
    let venv_path = home.join(".abel-voice-venv");

    if !venv_path.exists() {
        println!("Creating Python virtual environment...");
        create_venv(&venv_path).await?;
        install_dependencies(&venv_path).await?;
    }

    Ok(venv_path)
}

async fn create_venv(path: &Path) -> Result<()> {
    let output = Command::new("python3")
        .args(&["-m", "venv", path.to_str().unwrap()])
        .output()
        .context("Failed to create virtual environment. Is python3 installed?")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Failed to create venv:\n{}", stderr);
    }

    Ok(())
}

async fn install_dependencies(venv_path: &Path) -> Result<()> {
    let pip_exe = if cfg!(windows) {
        venv_path.join("Scripts").join("pip.exe")
    } else {
        venv_path.join("bin").join("pip")
    };

    println!("Installing pyserial...");
    let output = Command::new(&pip_exe)
        .args(&["install", "pyserial"])
        .output()
        .context("Failed to install pyserial")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Failed to install pyserial:\n{}", stderr);
    }

    Ok(())
}
