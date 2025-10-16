"""Smoke tests for ECHO.OS"""

import pytest
from echo_os.echo import ConsciousnessEngine
from echo_os.config import settings

def test_consciousness_engine():
    """Test basic consciousness engine functionality"""
    engine = ConsciousnessEngine()
    
    # Test observe
    result = engine.observe("Test observation")
    assert result["ok"] is True
    assert "Test observation" in result["note"]
    
    # Test intend
    result = engine.intend("Test objective")
    assert result["objective"] == "Test objective"
    
    # Test commit
    result = engine.commit("Test task", 60)
    assert result["task"] == "Test task"
    assert result["box"] == 60
    
    # Test reflect
    result = engine.reflect()
    assert "signals" in result

def test_config():
    """Test configuration loading"""
    assert hasattr(settings, 'openai_api_key')
    assert hasattr(settings, 'model')
    assert hasattr(settings, 'db_path')
